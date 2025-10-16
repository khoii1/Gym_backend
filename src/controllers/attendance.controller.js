import { AttendanceService } from "../services/attendance.service.js";

export async function checkIn(req, res) {
  try {
    const { memberId, note } = req.body;

    const { attendance, member, activeRegistration } =
      await AttendanceService.processCheckIn(memberId, note);

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
    console.error("Lỗi check-in:", error);

    // Handle specific business logic errors
    if (error.message === "Thành viên không tồn tại") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Thành viên không có gói tập đang hoạt động") {
      return res.status(400).json({
        message: error.message,
        suggestion: "Vui lòng đăng ký gói tập trước khi check-in",
      });
    }

    if (error.message === "Thành viên đã check-in rồi") {
      return res.status(400).json({
        message: error.message,
        suggestion: "Hãy check-out trước khi check-in lại",
      });
    }

    return res.status(500).json({
      message: "Lỗi check-in",
      error: error.message,
    });
  }
}

export async function checkOut(req, res) {
  try {
    const { memberId, note } = req.body;

    const { attendance, workoutDuration, checkoutTime } =
      await AttendanceService.processCheckOut(memberId, note);

    return res.json({
      message: `Tạm biệt ${attendance.member_id.fullName}! Cảm ơn bạn đã tập luyện`,
      attendance,
      workoutSummary: {
        checkinTime: attendance.checkin_time,
        checkoutTime: checkoutTime,
        duration: `${Math.floor(workoutDuration / 60)}h ${
          workoutDuration % 60
        }m`,
        durationMinutes: workoutDuration,
      },
    });
  } catch (error) {
    console.error("Lỗi check-out:", error);

    if (error.message === "Không tìm thấy check-in đang hoạt động") {
      return res.status(400).json({
        message: error.message,
        suggestion: "Thành viên chưa check-in hoặc đã check-out rồi",
      });
    }

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

    const result = await AttendanceService.getMemberAttendanceHistory(
      memberId,
      startDate,
      endDate,
      page,
      limit
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy lịch sử tập luyện",
      error: error.message,
    });
  }
}

export async function getTodayAttendance(req, res) {
  try {
    const result = await AttendanceService.getTodayAttendanceData();
    return res.json(result);
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

    const result = await AttendanceService.listAttendanceWithFilters(
      { memberId, date, status },
      page,
      limit
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách attendance",
      error: error.message,
    });
  }
}

export async function getAttendanceOverview(req, res) {
  try {
    const result = await AttendanceService.getAttendanceOverviewData();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi lấy tổng quan attendance",
      error: error.message,
    });
  }
}
