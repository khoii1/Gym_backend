import Member from "../models/Member.js";
import PackageRegistration from "../models/PackageRegistration.js";
import Attendance from "../models/Attendance.js";

export async function createMember(req, res) {
  try {
    const {
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
    } = req.body;

    // Check if email already exists
    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    const member = await Member.create({
      fullName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      membershipNumber: await generateMembershipNumber(),
      status: "active",
      joinDate: new Date(),
    });

    return res.status(201).json({
      message: "Tạo member thành công",
      member,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi tạo member",
      error: error.message,
    });
  }
}

export async function listMembers(req, res) {
  try {
    const {
      status,
      search,
      gender,
      hasActivePackage,
      page = 1,
      limit = 20,
    } = req.query;

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

    // Add active package info if requested
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

      // Filter members with active packages
      if (hasActivePackage === "true") {
        members = members.filter((m) => m.activePackage);
      }
    }

    const total = await Member.countDocuments(filter);

    return res.json({
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách members",
      error: error.message,
    });
  }
}

export async function getMemberById(req, res) {
  try {
    const { id } = req.params;

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy member" });
    }

    // Get active packages
    const activePackages = await PackageRegistration.find({
      member_id: id,
      status: "active",
      end_date: { $gte: new Date() },
    }).populate("package_id", "name duration price features");

    // Get recent attendance (last 30 days)
    const recentAttendance = await Attendance.find({
      member_id: id,
      checkin_time: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })
      .sort({ checkin_time: -1 })
      .limit(10);

    // Calculate attendance stats
    const totalSessions = await Attendance.countDocuments({ member_id: id });
    const thisMonthSessions = await Attendance.countDocuments({
      member_id: id,
      checkin_time: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    return res.json({
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
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy thông tin member",
      error: error.message,
    });
  }
}

export async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.membershipNumber;
    delete updateData.joinDate;

    const member = await Member.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy member" });
    }

    return res.json({
      message: "Cập nhật member thành công",
      member,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật member",
      error: error.message,
    });
  }
}

export async function deleteMember(req, res) {
  try {
    const { id } = req.params;

    // Check for active packages before deletion
    const activePackages = await PackageRegistration.countDocuments({
      member_id: id,
      status: "active",
      end_date: { $gte: new Date() },
    });

    if (activePackages > 0) {
      return res.status(400).json({
        message: "Không thể xóa member có gói đang hoạt động",
        activePackages,
      });
    }

    const member = await Member.findByIdAndDelete(id);
    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy member" });
    }

    return res.json({
      message: "Đã xóa member thành công",
      deletedMember: member.fullName,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi xóa member",
      error: error.message,
    });
  }
}

export async function getMemberActivePackages(req, res) {
  try {
    const { id } = req.params;

    const member = await Member.findById(id, "fullName email");
    if (!member) {
      return res.status(404).json({ message: "Không tìm thấy member" });
    }

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

    return res.json({
      member: member,
      activePackages,
      count: activePackages.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy gói đang hoạt động",
      error: error.message,
    });
  }
}

// Helper function to generate membership number
async function generateMembershipNumber() {
  const count = await Member.countDocuments();
  const year = new Date().getFullYear();
  return `GYM${year}${String(count + 1).padStart(4, "0")}`;
}
