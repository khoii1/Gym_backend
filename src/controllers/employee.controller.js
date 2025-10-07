import Employee from "../models/Employee.js";

export async function createEmployee(req, res) {
  try {
    const employee = await Employee.create(req.body);
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

    return res.json({
      success: true,
      data: employees,
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
      message: "Có lỗi xảy ra khi tải danh sách nhân viên",
      error: error.message,
    });
  }
}

export async function getEmployee(req, res) {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên này",
      });
    }

    return res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải thông tin nhân viên",
      error: error.message,
    });
  }
}

export async function updateEmployee(req, res) {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên này",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật thông tin nhân viên thành công",
      data: employee,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Không thể cập nhật thông tin nhân viên. Vui lòng kiểm tra lại",
      error: error.message,
    });
  }
}

export async function deleteEmployee(req, res) {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhân viên này",
      });
    }

    return res.json({
      success: true,
      message: "Xóa nhân viên thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa nhân viên",
      error: error.message,
    });
  }
}
