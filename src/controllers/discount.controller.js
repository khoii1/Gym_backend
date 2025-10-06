import Discount from "../models/Discount.js";

export async function createDiscount(req, res) {
  try {
    const discount = await Discount.create(req.body);
    return res.status(201).json({
      success: true,
      message: "Discount created successfully",
      data: discount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to create discount",
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
      message: "Failed to fetch discounts",
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
        message: "Discount not found",
      });
    }

    return res.json({
      success: true,
      data: discount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch discount",
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
        message: "Discount not found",
      });
    }

    return res.json({
      success: true,
      message: "Discount updated successfully",
      data: discount,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Failed to update discount",
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
        message: "Discount not found",
      });
    }

    return res.json({
      success: true,
      message: "Discount deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete discount",
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
      message: "Failed to fetch active discounts",
      error: error.message,
    });
  }
}
