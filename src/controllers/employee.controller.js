import { EmployeeService } from "../services/employee.service.js";

export async function createEmployee(req, res) {
  try {
    // Validate dữ liệu
    const validationErrors = EmployeeService.validateEmployeeData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validationErrors,
      });
    }

    // Kiểm tra email đã tồn tại
    const emailExists = await EmployeeService.checkEmailExists(req.body.email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email đã được sử dụng bởi nhân viên khác",
      });
    }

    const employee = await EmployeeService.createEmployee(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Không thể tạo nhân viên. Vui lòng kiểm tra lại thông tin",
      error: error.message,
    });
  }
}

export async function listEmployees(req, res) {
  try {
    const {
      position,
      department,
      status,
      search,
      limit = 20,
      page = 1,
    } = req.query;

    const result = await EmployeeService.getEmployeesWithFilters({
      position,
      department,
      status,
      search,
      limit,
      page,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải danh sách nhân viên",
      error: error.message,
    });
  }
}

export async function getEmployee(req, res) {
  try {
    const employee = await EmployeeService.getEmployeeById(req.params.id);

    return res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy nhân viên này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải thông tin nhân viên",
      error: error.message,
    });
  }
}

export async function updateEmployee(req, res) {
  try {
    const employee = await EmployeeService.updateEmployee(
      req.params.id,
      req.body
    );

    return res.json({
      success: true,
      message: "Cập nhật thông tin nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    if (
      error.message === "Không tìm thấy nhân viên này" ||
      error.message === "Email này đã được sử dụng"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Không thể cập nhật thông tin nhân viên. Vui lòng kiểm tra lại",
      error: error.message,
    });
  }
}

export async function deleteEmployee(req, res) {
  try {
    const result = await EmployeeService.deleteEmployee(req.params.id);

    return res.json(result);
  } catch (error) {
    if (error.message === "Không tìm thấy nhân viên này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa nhân viên",
      error: error.message,
    });
  }
}

// New enhanced controller methods using EmployeeService features
export async function getEmployeeStatistics(req, res) {
  try {
    const statistics = await EmployeeService.getEmployeeStatistics();

    return res.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải thống kê nhân viên",
      error: error.message,
    });
  }
}

export async function searchEmployees(req, res) {
  try {
    const { query, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
    }

    const employees = await EmployeeService.searchEmployees(
      query,
      parseInt(limit)
    );

    return res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tìm kiếm nhân viên",
      error: error.message,
    });
  }
}

export async function getEmployeesByDepartment(req, res) {
  try {
    const { department } = req.params;
    const employees = await EmployeeService.getEmployeesByDepartment(
      department
    );

    return res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải danh sách nhân viên theo phòng ban",
      error: error.message,
    });
  }
}

export async function getEmployeesByPosition(req, res) {
  try {
    const { position } = req.params;
    const employees = await EmployeeService.getEmployeesByPosition(position);

    return res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải danh sách nhân viên theo chức vụ",
      error: error.message,
    });
  }
}
