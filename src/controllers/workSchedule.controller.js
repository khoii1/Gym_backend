import WorkSchedule from "../models/WorkSchedule.js";
import Employee from "../models/Employee.js";

export async function createWorkSchedule(req, res) {
  try {
    // Validate employee exists
    const employee = await Employee.findById(req.body.employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const schedule = await WorkSchedule.create(req.body);
    const populatedSchedule = await WorkSchedule.findById(
      schedule._id
    ).populate("employeeId", "fullName email position department");

    return res.status(201).json({
      success: true,
      message: "Work schedule created successfully",
      data: populatedSchedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create work schedule",
      error: error.message,
    });
  }
}

export async function listWorkSchedules(req, res) {
  try {
    const {
      employeeId,
      date,
      status,
      shiftType,
      limit = 20,
      page = 1,
    } = req.query;

    const filter = {};
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;
    if (shiftType) filter.shiftType = shiftType;

    // Date filtering
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }

    const schedules = await WorkSchedule.find(filter)
      .populate("employeeId", "fullName email position department")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ date: -1, startTime: 1 });

    const total = await WorkSchedule.countDocuments(filter);

    return res.json({
      success: true,
      data: schedules,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch work schedules",
      error: error.message,
    });
  }
}

export async function getWorkScheduleById(req, res) {
  try {
    const schedule = await WorkSchedule.findById(req.params.id).populate(
      "employeeId",
      "fullName email position department"
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    return res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch work schedule",
      error: error.message,
    });
  }
}

export async function updateWorkSchedule(req, res) {
  try {
    const schedule = await WorkSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("employeeId", "fullName email position department");

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    return res.json({
      success: true,
      message: "Work schedule updated successfully",
      data: schedule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update work schedule",
      error: error.message,
    });
  }
}

export async function deleteWorkSchedule(req, res) {
  try {
    const schedule = await WorkSchedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Work schedule not found",
      });
    }

    return res.json({
      success: true,
      message: "Work schedule deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete work schedule",
      error: error.message,
    });
  }
}
