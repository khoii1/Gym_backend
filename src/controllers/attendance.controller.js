import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";
import PackageRegistration from "../models/PackageRegistration.js";

export async function checkIn(req, res) {
  try {
    const { memberId, note } = req.body;

    // 1. Validate member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member không tồn tại" });
    }

    // 2. Check for active package registration
    const activeRegistration = await PackageRegistration.findOne({
      member_id: memberId,
      status: "active",
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    }).populate("package_id", "name");

    if (!activeRegistration) {
      return res.status(400).json({
        message: "Member không có gói tập đang hoạt động",
        suggestion: "Vui lòng đăng ký gói tập trước khi check-in",
      });
    }

    // 3. Check if already checked in (no checkout yet)
    const existingCheckin = await Attendance.findOne({
      member_id: memberId,
      checkin_time: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
      },
      checkout_time: null,
    });

    if (existingCheckin) {
      return res.status(400).json({
        message: "Member đã check-in rồi",
        checkinTime: existingCheckin.checkin_time,
        suggestion: "Hãy check-out trước khi check-in lại",
      });
    }

    // 4. Create attendance record
    const attendance = await Attendance.create({
      member_id: memberId,
      registration_id: activeRegistration._id,
      checkin_time: new Date(),
      note: note || `Check-in với gói ${activeRegistration.package_id.name}`,
      status: "checked_in",
    });

    // 5. Update remaining sessions if applicable
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

    return res.status(201).json({
      message: `Check-in thành công! Chào mừng ${member.fullName}`,
      attendance,
      memberInfo: {
        name: member.fullName,
        package: activeRegistration.package_id.name,
        remainingSessions: activeRegistration.remaining_sessions,
        packageExpiry: activeRegistration.end_date,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return res.status(500).json({
      message: "Lỗi check-in",
      error: error.message,
    });
  }
}

export async function checkOut(req, res) {
  try {
    const { memberId, note } = req.body;

    // 1. Find active check-in for today
    const activeCheckin = await Attendance.findOne({
      member_id: memberId,
      checkin_time: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
      checkout_time: null,
      status: "checked_in",
    }).populate("member_id", "fullName");

    if (!activeCheckin) {
      return res.status(400).json({
        message: "Không tìm thấy check-in active",
        suggestion: "Member chưa check-in hoặc đã check-out rồi",
      });
    }

    // 2. Calculate workout duration
    const checkoutTime = new Date();
    const workoutDuration = Math.round(
      (checkoutTime - activeCheckin.checkin_time) / (1000 * 60)
    ); // minutes

    // 3. Update attendance record
    activeCheckin.checkout_time = checkoutTime;
    activeCheckin.workout_duration = workoutDuration;
    activeCheckin.status = "completed";
    if (note) activeCheckin.note += ` | Check-out: ${note}`;

    await activeCheckin.save();

    return res.json({
      message: `Tạm biệt ${activeCheckin.member_id.fullName}! Cảm ơn bạn đã tập luyện`,
      attendance: activeCheckin,
      workoutSummary: {
        checkinTime: activeCheckin.checkin_time,
        checkoutTime: checkoutTime,
        duration: `${Math.floor(workoutDuration / 60)}h ${
          workoutDuration % 60
        }m`,
        durationMinutes: workoutDuration,
      },
    });
  } catch (error) {
    console.error("Check-out error:", error);
    return res.status(500).json({
      message: "Lỗi check-out",
      error: error.message,
    });
  }
}

export async function getMemberAttendance(req, res) {
  try {
    const { memberId } = req.params;
    const {
      startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate = new Date(),
      page = 1,
      limit = 20,
    } = req.query;

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

    return res.json({
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
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy lịch sử tập luyện",
      error: error.message,
    });
  }
}

export async function getTodayAttendance(req, res) {
  try {
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

    return res.json({
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
        duration: Math.round((new Date() - a.checkin_time) / (1000 * 60)), // minutes
      })),
      allTodayAttendance: todayAttendance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy thông tin hôm nay",
      error: error.message,
    });
  }
}

export async function listAttendance(req, res) {
  try {
    const { memberId, date, status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (memberId) filter.member_id = memberId;
    if (status) filter.status = status;
    if (date) {
      const targetDate = new Date(date);
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

    return res.json({
      attendance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách attendance",
      error: error.message,
    });
  }
}

export async function getAttendanceOverview(req, res) {
  try {
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

    return res.json({
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
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy tổng quan attendance",
      error: error.message,
    });
  }
}
