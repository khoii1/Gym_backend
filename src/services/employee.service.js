import Employee from "../models/Employee.js";

export class EmployeeService {
  /** Tạo nhân viên mới */
  static async createEmployee(employeeData) {
    const employee = await Employee.create(employeeData);
    return employee;
  }

  /** Lấy danh sách nhân viên với filter và pagination */
  static async getEmployeesWithFilters({
    position,
    department,
    status,
    search,
    limit = 20,
    page = 1,
  }) {
    const filter = {};
    if (position) filter.position = position;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ];
    }

    const employees = await Employee.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(filter);

    return {
      success: true,
      data: employees,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    };
  }

  /** Lấy nhân viên theo ID */
  static async getEmployeeById(employeeId) {
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      throw new Error("Không tìm thấy nhân viên này");
    }

    return employee;
  }

  /** Cập nhật thông tin nhân viên */
  static async updateEmployee(employeeId, updateData) {
    const employee = await Employee.findByIdAndUpdate(employeeId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      throw new Error("Không tìm thấy nhân viên này");
    }

    return employee;
  }

  /** Xóa nhân viên */
  static async deleteEmployee(employeeId) {
    const employee = await Employee.findByIdAndDelete(employeeId);

    if (!employee) {
      throw new Error("Không tìm thấy nhân viên này");
    }

    return employee;
  }

  /** Kiểm tra email nhân viên đã tồn tại */
  static async checkEmailExists(email, excludeId = null) {
    const filter = { email };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const existingEmployee = await Employee.findOne(filter);
    return !!existingEmployee;
  }

  /** Lấy nhân viên theo vị trí/phòng ban */
  static async getEmployeesByDepartment(department) {
    const employees = await Employee.find({
      department,
      status: "active",
    }).select("fullName email position");

    return employees;
  }

  /** Lấy nhân viên theo vị trí */
  static async getEmployeesByPosition(position) {
    const employees = await Employee.find({
      position,
      status: "active",
    }).select("fullName email department");

    return employees;
  }

  /** Lấy thống kê nhân viên */
  static async getEmployeeStatistics() {
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const byDepartment = await Employee.aggregate([
      {
        $match: { status: "active" },
      },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          avgSalary: { $avg: "$salary" },
        },
      },
    ]);

    const byPosition = await Employee.aggregate([
      {
        $match: { status: "active" },
      },
      {
        $group: {
          _id: "$position",
          count: { $sum: 1 },
          avgSalary: { $avg: "$salary" },
        },
      },
    ]);

    const totalActive = await Employee.countDocuments({ status: "active" });
    const totalInactive = await Employee.countDocuments({ status: "inactive" });
    const totalTerminated = await Employee.countDocuments({
      status: "terminated",
    });

    return {
      total: {
        active: totalActive,
        inactive: totalInactive,
        terminated: totalTerminated,
      },
      byStatus: stats,
      byDepartment,
      byPosition,
    };
  }

  /** Tìm kiếm nhân viên nâng cao */
  static async searchEmployees(searchTerm) {
    const employees = await Employee.find({
      $or: [
        { fullName: { $regex: searchTerm, $options: "i" } },
        { email: { $regex: searchTerm, $options: "i" } },
        { position: { $regex: searchTerm, $options: "i" } },
        { department: { $regex: searchTerm, $options: "i" } },
        { phone: { $regex: searchTerm, $options: "i" } },
      ],
      status: "active",
    }).select("fullName email position department phone");

    return employees;
  }

  /** Cập nhật trạng thái nhân viên */
  static async updateEmployeeStatus(employeeId, status) {
    const validStatuses = ["active", "inactive", "terminated"];
    if (!validStatuses.includes(status)) {
      throw new Error("Trạng thái không hợp lệ");
    }

    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { status },
      { new: true, runValidators: true }
    );

    if (!employee) {
      throw new Error("Không tìm thấy nhân viên này");
    }

    return employee;
  }

  /** Lấy nhân viên mới nhất */
  static async getRecentEmployees(limit = 5) {
    const employees = await Employee.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("fullName position department hireDate");

    return employees;
  }

  /** Lấy danh sách sinh nhật trong tháng */
  static async getBirthdaysThisMonth() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;

    const employees = await Employee.find({
      status: "active",
      dateOfBirth: { $exists: true },
    }).select("fullName dateOfBirth position department");

    // Filter by birth month in JavaScript since MongoDB date operations can be complex
    const birthdaysThisMonth = employees.filter((emp) => {
      if (emp.dateOfBirth) {
        const birthMonth = emp.dateOfBirth.getMonth() + 1;
        return birthMonth === currentMonth;
      }
      return false;
    });

    return birthdaysThisMonth;
  }

  /** Validate dữ liệu nhân viên */
  static validateEmployeeData(employeeData) {
    const errors = [];

    if (!employeeData.fullName || employeeData.fullName.trim().length < 2) {
      errors.push("Họ tên phải có ít nhất 2 ký tự");
    }

    if (!employeeData.email || !/\S+@\S+\.\S+/.test(employeeData.email)) {
      errors.push("Email không hợp lệ");
    }

    if (!employeeData.phone || employeeData.phone.length < 10) {
      errors.push("Số điện thoại không hợp lệ");
    }

    if (!employeeData.position || employeeData.position.trim().length < 2) {
      errors.push("Vị trí công việc là bắt buộc");
    }

    if (employeeData.salary && employeeData.salary < 0) {
      errors.push("Lương không thể âm");
    }

    return errors;
  }
}
