import { WorkScheduleService } from "../services/workSchedule.service.js";

export async function createWorkSchedule(req, res) {
  try {
    const schedule = await WorkScheduleService.createWorkSchedule(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo lịch làm việc thành công",
      data: schedule,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy nhân viên này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function listWorkSchedules(req, res) {
  try {
    const result = await WorkScheduleService.listWorkSchedules(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getWorkScheduleById(req, res) {
  try {
    const result = await WorkScheduleService.getWorkScheduleById(req.params.id);
    return res.json(result);
  } catch (error) {
    if (error.message === "Không tìm thấy lịch làm việc này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updateWorkSchedule(req, res) {
  try {
    const schedule = await WorkScheduleService.updateWorkSchedule(
      req.params.id,
      req.body
    );
    return res.json({
      success: true,
      message: "Cập nhật lịch làm việc thành công",
      data: schedule,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy lịch làm việc này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteWorkSchedule(req, res) {
  try {
    const schedule = await WorkScheduleService.deleteWorkSchedule(
      req.params.id
    );
    return res.json({
      success: true,
      message: "Xóa lịch làm việc thành công",
    });
  } catch (error) {
    if (error.message === "Không tìm thấy lịch làm việc này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
