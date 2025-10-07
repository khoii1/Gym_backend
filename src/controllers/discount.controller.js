import Discount from "../models/Discount.js";

export async function createDiscount(req, res) {
  try {
    const discount = await Discount.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo khuyến mãi thành công",
      data: discount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Không thể tạo khuyến mãi. Vui lòng kiểm tra lại thông tin",
      error: error.message,
    });
  }
}

export async function listDiscounts(req, res) {
  try {
    const { status, type, limit = 20, page = 1 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const discounts = await Discount.find(filter)
      .populate("applicablePackages", "name price")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Discount.countDocuments(filter);

    return res.json({
      success: true,
      data: discounts,
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
      message: "Có lỗi xảy ra khi tải danh sách khuyến mãi",
      error: error.message,
    });
  }
}

export async function getDiscountById(req, res) {
  try {
    const discount = await Discount.findById(req.params.id).populate(
      "applicablePackages",
      "name price duration"
    );

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi này",
      });
    }

    return res.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải thông tin khuyến mãi",
      error: error.message,
    });
  }
}

export async function updateDiscount(req, res) {
  try {
    const discount = await Discount.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("applicablePackages", "name price");

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi này",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật khuyến mãi thành công",
      data: discount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Không thể cập nhật khuyến mãi. Vui lòng kiểm tra lại thông tin",
      error: error.message,
    });
  }
}

export async function deleteDiscount(req, res) {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy khuyến mãi này",
      });
    }

    return res.json({
      success: true,
      message: "Xóa khuyến mãi thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa khuyến mãi",
      error: error.message,
    });
  }
}

export async function getActiveDiscounts(req, res) {
  try {
    const now = new Date();
    const discounts = await Discount.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate("applicablePackages", "name price");

    return res.json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải danh sách khuyến mãi đang hoạt động",
      error: error.message,
    });
  }
}
