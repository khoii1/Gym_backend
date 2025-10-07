import Package from "../models/Package.js";

export async function createPackage(req, res) {
  try {
    const packageData = await Package.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo gói tập thành công",
      data: packageData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Không thể tạo gói tập. Vui lòng kiểm tra lại thông tin",
      error: error.message,
    });
  }
}

export async function listPackages(req, res) {
  try {
    const { status, minPrice, maxPrice, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const packages = await Package.find(filter)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Package.countDocuments(filter);

    return res.json({
      success: true,
      data: packages,
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
      message: "Có lỗi xảy ra khi tải danh sách gói tập",
      error: error.message,
    });
  }
}

export async function getPackageById(req, res) {
  try {
    const packageData = await Package.findById(req.params.id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gói tập này",
      });
    }

    return res.json({
      success: true,
      data: packageData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải thông tin gói tập",
      error: error.message,
    });
  }
}

export async function updatePackage(req, res) {
  try {
    const packageData = await Package.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gói tập này",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật gói tập thành công",
      data: packageData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Không thể cập nhật gói tập. Vui lòng kiểm tra lại thông tin",
      error: error.message,
    });
  }
}

export async function deletePackage(req, res) {
  try {
    const packageData = await Package.findByIdAndDelete(req.params.id);

    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy gói tập này",
      });
    }

    return res.json({
      success: true,
      message: "Xóa gói tập thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa gói tập",
      error: error.message,
    });
  }
}
