import Member from "../models/Member.js";
import PackageRegistration from "../models/PackageRegistration.js";
import Attendance from "../models/Attendance.js";

export class MemberService {
  static async generateMembershipNumber() {
    const count = await Member.countDocuments();
    const year = new Date().getFullYear();
    return `GYM${year}${String(count + 1).padStart(4, "0")}`;
  }

  static async createMember(data) {
    const {
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
    } = data;
    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      throw new Error("Email đã được sử dụng");
    }
    const member = await Member.create({
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      membershipNumber: await this.generateMembershipNumber(),
      status: "active",
      joinDate: new Date(),
    });
    return member;
  }

  static async listMembers(query) {
    const {
      status,
      search,
      gender,
      hasActivePackage,
      page = 1,
      limit = 20,
    } = query;
    const filter = {};
    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { membershipNumber: { $regex: search, $options: "i" } },
      ];
    }
    let members = await Member.find(filter)
      .select("-__v")
      .sort({ joinDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    if (hasActivePackage === "true") {
      for (let member of members) {
        const activePackage = await PackageRegistration.findOne({
          member_id: member._id,
          status: "active",
          end_date: { $gte: new Date() },
        })
          .populate("package_id", "name")
          .lean();
        member.activePackage = activePackage;
      }
      members = members.filter((m) => m.activePackage);
    }
    const total = await Member.countDocuments(filter);
    return {
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getMemberById(id) {
    const member = await Member.findById(id);
    if (!member) throw new Error("Không tìm thấy thành viên này");
    const activePackages = await PackageRegistration.find({
      member_id: id,
      status: "active",
      end_date: { $gte: new Date() },
    }).populate("package_id", "name duration price features");
    const recentAttendance = await Attendance.find({
      member_id: id,
      checkin_time: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .sort({ checkin_time: -1 })
      .limit(10);
    const totalSessions = await Attendance.countDocuments({ member_id: id });
    const thisMonthSessions = await Attendance.countDocuments({
      member_id: id,
      checkin_time: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });
    return {
      member,
      activePackages,
      recentAttendance,
      statistics: {
        totalSessions,
        thisMonthSessions,
        memberSince: member.joinDate,
        daysSinceMember: Math.floor(
          (new Date() - member.joinDate) / (1000 * 60 * 60 * 24)
        ),
      },
    };
  }

  static async updateMember(id, updateData) {
    delete updateData.membershipNumber;
    delete updateData.joinDate;
    const member = await Member.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!member) throw new Error("Không tìm thấy thành viên này");
    return member;
  }

  static async deleteMember(id) {
    const activePackages = await PackageRegistration.countDocuments({
      member_id: id,
      status: "active",
      end_date: { $gte: new Date() },
    });
    if (activePackages > 0) {
      const err = new Error(
        "Không thể xóa thành viên có gói tập đang hoạt động"
      );
      err.activePackages = activePackages;
      throw err;
    }
    const member = await Member.findByIdAndDelete(id);
    if (!member) throw new Error("Không tìm thấy thành viên này");
    return member;
  }

  static async getMemberActivePackages(id) {
    const member = await Member.findById(id, "fullName email");
    if (!member) throw new Error("Không tìm thấy thành viên này");
    const activePackages = await PackageRegistration.find({
      member_id: id,
      status: "active",
      start_date: { $lte: new Date() },
      end_date: { $gte: new Date() },
    })
      .populate(
        "package_id",
        "name description duration price features sessions"
      )
      .populate("discount_id", "name type value")
      .sort({ createdAt: -1 });
    return {
      member,
      activePackages,
      count: activePackages.length,
    };
  }
}
