import Discount from "../models/Discount.js";

export class DiscountService {
  /** Tạo khuyến mãi mới */
  static async createDiscount(discountData) {
    const discount = await Discount.create(discountData);
    return discount;
  }

  /** Lấy danh sách khuyến mãi với filter và pagination */
  static async getDiscountsWithFilters({ status, type, limit = 20, page = 1 }) {
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const discounts = await Discount.find(filter)
      .populate("applicablePackages", "name price")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Discount.countDocuments(filter);

    return {
      success: true,
      data: discounts,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    };
  }

  /** Lấy khuyến mãi theo ID */
  static async getDiscountById(discountId) {
    const discount = await Discount.findById(discountId).populate(
      "applicablePackages",
      "name price duration"
    );

    if (!discount) {
      throw new Error("Không tìm thấy khuyến mãi này");
    }

    return discount;
  }

  /** Cập nhật khuyến mãi */
  static async updateDiscount(discountId, updateData) {
    const discount = await Discount.findByIdAndUpdate(discountId, updateData, {
      new: true,
      runValidators: true,
    }).populate("applicablePackages", "name price");

    if (!discount) {
      throw new Error("Không tìm thấy khuyến mãi này");
    }

    return discount;
  }

  /** Xóa khuyến mãi */
  static async deleteDiscount(discountId) {
    const discount = await Discount.findByIdAndDelete(discountId);

    if (!discount) {
      throw new Error("Không tìm thấy khuyến mãi này");
    }

    return discount;
  }

  /** Lấy danh sách khuyến mãi đang hoạt động */
  static async getActiveDiscounts() {
    const now = new Date();
    const discounts = await Discount.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate("applicablePackages", "name price");

    return discounts;
  }

  /** Kiểm tra tính hợp lệ của khuyến mãi */
  static async validateDiscountCode(code, packageId = null) {
    const now = new Date();
    const discount = await Discount.findOne({
      code: code,
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate("applicablePackages");

    if (!discount) {
      throw new Error("Mã khuyến mãi không hợp lệ hoặc đã hết hạn");
    }

    // Kiểm tra usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      throw new Error("Mã khuyến mãi đã hết lượt sử dụng");
    }

    // Kiểm tra package áp dụng
    if (packageId && discount.applicablePackages.length > 0) {
      const isApplicable = discount.applicablePackages.some(
        (pkg) => pkg._id.toString() === packageId
      );
      if (!isApplicable) {
        throw new Error("Mã khuyến mãi không áp dụng cho gói tập này");
      }
    }

    return discount;
  }

  /** Tính toán giá trị giảm giá */
  static calculateDiscountAmount(discount, originalPrice) {
    if (discount.type === "percentage") {
      return Math.min(
        (originalPrice * discount.value) / 100,
        discount.maxDiscountAmount || Infinity
      );
    } else if (discount.type === "fixed") {
      return Math.min(discount.value, originalPrice);
    }
    return 0;
  }

  /** Áp dụng khuyến mãi */
  static async applyDiscount(discountCode, packageId, originalPrice) {
    const discount = await this.validateDiscountCode(discountCode, packageId);
    const discountAmount = this.calculateDiscountAmount(
      discount,
      originalPrice
    );
    const finalPrice = originalPrice - discountAmount;

    return {
      discount,
      originalPrice,
      discountAmount,
      finalPrice,
      savings: discountAmount,
    };
  }

  /** Cập nhật số lần sử dụng khuyến mãi */
  static async incrementUsageCount(discountId) {
    await Discount.findByIdAndUpdate(discountId, {
      $inc: { usedCount: 1 },
    });
  }

  /** Lấy thống kê khuyến mãi */
  static async getDiscountStatistics() {
    const stats = await Discount.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalUsage: { $sum: "$usedCount" },
        },
      },
    ]);

    const totalActive = await Discount.countDocuments({
      status: "active",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    const expiringSoon = await Discount.countDocuments({
      status: "active",
      endDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày tới
      },
    });

    return {
      byStatus: stats,
      totalActive,
      expiringSoon,
    };
  }
}
