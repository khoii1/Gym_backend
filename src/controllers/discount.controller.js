import { DiscountService } from "../services/discount.service.js";

export async function createDiscount(req, res) {
  try {
    const discount = await DiscountService.createDiscount(req.body);
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

    const result = await DiscountService.getDiscountsWithFilters({
      status,
      type,
      limit,
      page,
    });

    return res.json(result);
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
    const discount = await DiscountService.getDiscountById(req.params.id);

    return res.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy khuyến mãi này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải thông tin khuyến mãi",
      error: error.message,
    });
  }
}

export async function updateDiscount(req, res) {
  try {
    const discount = await DiscountService.updateDiscount(
      req.params.id,
      req.body
    );

    return res.json({
      success: true,
      message: "Cập nhật khuyến mãi thành công",
      data: discount,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy khuyến mãi này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Không thể cập nhật khuyến mãi. Vui lòng kiểm tra lại thông tin",
      error: error.message,
    });
  }
}

export async function deleteDiscount(req, res) {
  try {
    await DiscountService.deleteDiscount(req.params.id);

    return res.json({
      success: true,
      message: "Xóa khuyến mãi thành công",
    });
  } catch (error) {
    if (error.message === "Không tìm thấy khuyến mãi này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi xóa khuyến mãi",
      error: error.message,
    });
  }
}

export async function getActiveDiscounts(req, res) {
  try {
    const discounts = await DiscountService.getActiveDiscounts();

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

export async function validateDiscountCode(req, res) {
  try {
    const { code, packageId } = req.body;

    const discount = await DiscountService.validateDiscountCode(
      code,
      packageId
    );

    return res.json({
      success: true,
      message: "Mã khuyến mãi hợp lệ",
      data: discount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function applyDiscount(req, res) {
  try {
    const { discountCode, packageId, originalPrice } = req.body;

    const result = await DiscountService.applyDiscount(
      discountCode,
      packageId,
      originalPrice
    );

    return res.json({
      success: true,
      message: "Áp dụng khuyến mãi thành công",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getDiscountStatistics(req, res) {
  try {
    const stats = await DiscountService.getDiscountStatistics();

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi tải thống kê khuyến mãi",
      error: error.message,
    });
  }
}
