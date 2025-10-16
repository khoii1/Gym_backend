import WorkSchedule from "../models/WorkSchedule.js";
import Employee from "../models/Employee.js";

export class WorkScheduleService {
  static async createWorkSchedule(scheduleData) {
    try {
      // Validate employee exists
      const employee = await Employee.findById(scheduleData.employeeId);
      if (!employee) {
        throw new Error("Không tìm thấy nhân viên này");
      }

      const schedule = await WorkSchedule.create(scheduleData);
      const populatedSchedule = await WorkSchedule.findById(
        schedule._id
      ).populate("employeeId", "fullName email position department");

      return populatedSchedule;
    } catch (error) {
      if (error.message === "Không tìm thấy nhân viên này") {
        throw error;
      }
      throw new Error(
        `Không thể tạo lịch làm việc. Vui lòng kiểm tra lại thông tin: ${error.message}`
      );
    }
  }

  static async listWorkSchedules(queryParams) {
    try {
      const {
        employeeId,
        date,
        status,
        shiftType,
        limit = 20,
        page = 1,
      } = queryParams;

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

      return {
        success: true,
        data: schedules,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Có lỗi xảy ra khi tải danh sách lịch làm việc: ${error.message}`
      );
    }
  }

  static async getWorkScheduleById(scheduleId) {
    try {
      const schedule = await WorkSchedule.findById(scheduleId).populate(
        "employeeId",
        "fullName email position department"
      );

      if (!schedule) {
        throw new Error("Không tìm thấy lịch làm việc này");
      }

      return {
        success: true,
        data: schedule,
      };
    } catch (error) {
      if (error.message === "Không tìm thấy lịch làm việc này") {
        throw error;
      }
      throw new Error(
        `Có lỗi xảy ra khi tải thông tin lịch làm việc: ${error.message}`
      );
    }
  }

  static async updateWorkSchedule(scheduleId, updateData) {
    try {
      const schedule = await WorkSchedule.findByIdAndUpdate(
        scheduleId,
        updateData,
        { new: true, runValidators: true }
      ).populate("employeeId", "fullName email position department");

      if (!schedule) {
        throw new Error("Không tìm thấy lịch làm việc này");
      }

      return schedule;
    } catch (error) {
      if (error.message === "Không tìm thấy lịch làm việc này") {
        throw error;
      }
      throw new Error(
        `Có lỗi xảy ra khi cập nhật lịch làm việc: ${error.message}`
      );
    }
  }

  static async deleteWorkSchedule(scheduleId) {
    try {
      const schedule = await WorkSchedule.findByIdAndDelete(scheduleId);

      if (!schedule) {
        throw new Error("Không tìm thấy lịch làm việc này");
      }

      return schedule;
    } catch (error) {
      if (error.message === "Không tìm thấy lịch làm việc này") {
        throw error;
      }
      throw new Error(`Có lỗi xảy ra khi xóa lịch làm việc: ${error.message}`);
    }
  }
}
