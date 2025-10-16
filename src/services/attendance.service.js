import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";
import PackageRegistration from "../models/PackageRegistration.js";

export class AttendanceService {
  // Validate member exists and has active package
  static async validateMemberForCheckIn(memberId) {
    const member = await Member.findById(memberId);
    if (!member) {
      throw new Error("Thành viên không tồn tại");
    }

    const activeRegistration = await PackageRegistration.findOne({
      member_id: memberId,
      status: "active",
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    }).populate("package_id", "name");

    if (!activeRegistration) {
      throw new Error("Thành viên không có gói tập đang hoạt động");
    }

    return { member, activeRegistration };
  }

  // Check if member already checked in today
  static async checkExistingCheckIn(memberId) {
    const existingCheckin = await Attendance.findOne({
      member_id: memberId,
      checkin_time: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
      checkout_time: null,
    });

    if (existingCheckin) {
      throw new Error("Thành viên đã check-in rồi");
    }

    return false;
  }

  // Create attendance record and update sessions
  static async createAttendanceRecord(memberId, activeRegistration, note) {
    const attendance = await Attendance.create({
      member_id: memberId,
      registration_id: activeRegistration._id,
      checkin_time: new Date(),
      note: note || `Check-in với gói ${activeRegistration.package_id.name}`,
      status: "checked_in",
    });

    // Update remaining sessions if applicable
    if (
      activeRegistration.remaining_sessions !== null &&
      activeRegistration.remaining_sessions > 0
    ) {
      await PackageRegistration.findByIdAndUpdate(activeRegistration._id, {
        $inc: { remaining_sessions: -1 },
      });
    }

    await attendance.populate([
      { path: "member_id", select: "fullName email phone" },
      {
        path: "registration_id",
        populate: { path: "package_id", select: "name" },
      },
    ]);

    return attendance;
  }

  // Process check-in
  static async processCheckIn(memberId, note) {
    const { member, activeRegistration } = await this.validateMemberForCheckIn(
      memberId
    );
    await this.checkExistingCheckIn(memberId);
    const attendance = await this.createAttendanceRecord(
      memberId,
      activeRegistration,
      note
    );

    return {
      attendance,
      member,
      activeRegistration,
    };
  }

  // Find active check-in for checkout
  static async findActiveCheckIn(memberId) {
    const activeCheckin = await Attendance.findOne({
      member_id: memberId,
      checkin_time: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
      checkout_time: null,
      status: "checked_in",
    }).populate("member_id", "fullName");

    if (!activeCheckin) {
      throw new Error("Không tìm thấy check-in đang hoạt động");
    }

    return activeCheckin;
  }

  // Process check-out
  static async processCheckOut(memberId, note) {
    const activeCheckin = await this.findActiveCheckIn(memberId);

    const checkoutTime = new Date();
    const workoutDuration = Math.round(
      (checkoutTime - activeCheckin.checkin_time) / (1000 * 60)
    );

    activeCheckin.checkout_time = checkoutTime;
    activeCheckin.workout_duration = workoutDuration;
    activeCheckin.status = "completed";
    if (note) activeCheckin.note += ` | Check-out: ${note}`;

    await activeCheckin.save();

    return {
      attendance: activeCheckin,
      workoutDuration,
      checkoutTime,
    };
  }

  // Get member attendance history with statistics
  static async getMemberAttendanceHistory(
    memberId,
    startDate,
    endDate,
    page,
    limit
  ) {
    const attendance = await Attendance.find({
      member_id: memberId,
      checkin_time: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    })
      .populate("registration_id", "package_id")
      .populate({
        path: "registration_id",
        populate: { path: "package_id", select: "name" },
      })
      .sort({ checkin_time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalSessions = await Attendance.countDocuments({
      member_id: memberId,
      checkin_time: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    const totalWorkoutTime = await Attendance.aggregate([
      {
        $match: {
          member_id: new mongoose.Types.ObjectId(memberId),
          workout_duration: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: null,
          totalMinutes: { $sum: "$workout_duration" },
        },
      },
    ]);

    return {
      attendance,
      statistics: {
        totalSessions,
        totalWorkoutTimeMinutes: totalWorkoutTime[0]?.totalMinutes || 0,
        averageSessionTime:
          totalSessions > 0
            ? Math.round(
                (totalWorkoutTime[0]?.totalMinutes || 0) / totalSessions
              )
            : 0,
        period: { startDate, endDate },
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / limit),
      },
    };
  }

  // Get today's attendance data
  static async getTodayAttendanceData() {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayAttendance = await Attendance.find({
      checkin_time: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("member_id", "fullName phone")
      .populate("registration_id", "package_id")
      .populate({
        path: "registration_id",
        populate: { path: "package_id", select: "name" },
      })
      .sort({ checkin_time: -1 });

    const currentlyInGym = todayAttendance.filter(
      (a) => a.status === "checked_in"
    );
    const completedSessions = todayAttendance.filter(
      (a) => a.status === "completed"
    );

    return {
      date: new Date().toISOString().split("T")[0],
      summary: {
        totalCheckins: todayAttendance.length,
        currentlyInGym: currentlyInGym.length,
        completedSessions: completedSessions.length,
      },
      currentlyInGym: currentlyInGym.map((a) => ({
        member: a.member_id,
        checkinTime: a.checkin_time,
        package: a.registration_id?.package_id?.name,
        duration: Math.round((new Date() - a.checkin_time) / (1000 * 60)),
      })),
      allTodayAttendance: todayAttendance,
    };
  }

  // List attendance with filters
  static async listAttendanceWithFilters(filters, page, limit) {
    const filter = {};
    if (filters.memberId) filter.member_id = filters.memberId;
    if (filters.status) filter.status = filters.status;
    if (filters.date) {
      const targetDate = new Date(filters.date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      filter.checkin_time = { $gte: startOfDay, $lte: endOfDay };
    }

    const attendance = await Attendance.find(filter)
      .populate("member_id", "fullName email phone")
      .populate("registration_id", "package_id")
      .populate({
        path: "registration_id",
        populate: { path: "package_id", select: "name duration" },
      })
      .sort({ checkin_time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    return {
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get attendance overview with analytics
  static async getAttendanceOverviewData() {
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    // Get today's stats
    const todayStats = await Attendance.aggregate([
      {
        $match: {
          checkin_time: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalCheckins: { $sum: 1 },
          totalCheckouts: {
            $sum: { $cond: [{ $ne: ["$checkout_time", null] }, 1, 0] },
          },
          currentlyInGym: {
            $sum: { $cond: [{ $eq: ["$checkout_time", null] }, 1, 0] },
          },
          avgWorkoutDuration: { $avg: "$workout_duration" },
        },
      },
    ]);

    // Get weekly stats (last 7 days)
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyStats = await Attendance.aggregate([
      {
        $match: {
          checkin_time: { $gte: weekStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkin_time" } },
          dailyCheckins: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get most active members this week
    const activeMembersThisWeek = await Attendance.aggregate([
      {
        $match: {
          checkin_time: { $gte: weekStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: "$member_id",
          visitCount: { $sum: 1 },
          lastVisit: { $max: "$checkin_time" },
        },
      },
      { $sort: { visitCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "members",
          localField: "_id",
          foreignField: "_id",
          as: "memberInfo",
        },
      },
      { $unwind: "$memberInfo" },
      {
        $project: {
          _id: 1,
          visitCount: 1,
          lastVisit: 1,
          "memberInfo.fullName": 1,
          "memberInfo.membershipNumber": 1,
        },
      },
    ]);

    const stats = todayStats[0] || {
      totalCheckins: 0,
      totalCheckouts: 0,
      currentlyInGym: 0,
      avgWorkoutDuration: 0,
    };

    return {
      success: true,
      data: {
        today: {
          date: todayStart.toISOString().split("T")[0],
          totalCheckins: stats.totalCheckins,
          totalCheckouts: stats.totalCheckouts,
          currentlyInGym: stats.currentlyInGym,
          avgWorkoutDuration: Math.round(stats.avgWorkoutDuration || 0),
        },
        weeklyTrend: weeklyStats,
        mostActiveMembers: activeMembersThisWeek,
      },
    };
  }
}
