import PackageRegistration from "../models/PackageRegistration.js";
import Member from "../models/Member.js";
import Package from "../models/Package.js";
import Discount from "../models/Discount.js";
import { sendMail } from "../services/email.service.js";

export async function createRegistration(req, res) {
  try {
    const {
      memberId,
      packageId,
      discountId,
      paymentMethod = "cash",
    } = req.body;

    // 1. Validate member exists
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member không tồn tại" });
    }

    // 2. Validate package exists and is active
    const packageData = await Package.findById(packageId);
    if (!packageData) {
      return res.status(404).json({ message: "Package không tồn tại" });
    }

    // 3. Check for existing active registration
    const existingRegistration = await PackageRegistration.findOne({
      member_id: memberId,
      end_date: { $gt: new Date() },
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "Member đã có gói đang hoạt động",
        activePackage: existingRegistration,
      });
    }

    // 4. Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + packageData.duration);

    // 5. Calculate pricing with discount
    let finalPrice = packageData.price;
    let discountAmount = 0;

    if (discountId) {
      const discount = await Discount.findById(discountId);
      if (
        discount &&
        discount.validFrom <= new Date() &&
        discount.validTo >= new Date()
      ) {
        if (discount.type === "percentage") {
          discountAmount = (packageData.price * discount.value) / 100;
        } else if (discount.type === "fixed") {
          discountAmount = discount.value;
        }
        finalPrice = Math.max(0, packageData.price - discountAmount);
      }
    }

    // 6. Create registration
    const registration = await PackageRegistration.create({
      member_id: memberId,
      package_id: packageId,
      discount_id: discountId,
      start_date: startDate,
      end_date: endDate,
      remaining_sessions: packageData.sessions || null,
      payment_method: paymentMethod,
      original_price: packageData.price,
      discount_amount: discountAmount,
      final_price: finalPrice,
      status: "active",
    });

    // 7. Populate for response
    await registration.populate([
      { path: "member_id", select: "fullName email phone" },
      {
        path: "package_id",
        select: "name description duration price features",
      },
      { path: "discount_id", select: "name type value" },
    ]);

    // 8. Send confirmation email
    try {
      await sendMail({
        to: member.email,
        subject: `🎉 Đăng ký gói tập thành công - ${packageData.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🏋️‍♂️ Chào mừng ${member.fullName}!</h2>
            <p>Bạn đã đăng ký thành công gói tập <strong>${
              packageData.name
            }</strong></p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📋 Chi tiết đăng ký:</h3>
              <p><strong>Gói:</strong> ${packageData.name}</p>
              <p><strong>Thời hạn:</strong> ${packageData.duration} ngày</p>
              <p><strong>Bắt đầu:</strong> ${startDate.toLocaleDateString(
                "vi-VN"
              )}</p>
              <p><strong>Kết thúc:</strong> ${endDate.toLocaleDateString(
                "vi-VN"
              )}</p>
              <p><strong>Giá gốc:</strong> ${packageData.price.toLocaleString(
                "vi-VN"
              )} VNĐ</p>
              ${
                discountAmount > 0
                  ? `<p><strong>Giảm giá:</strong> -${discountAmount.toLocaleString(
                      "vi-VN"
                    )} VNĐ</p>`
                  : ""
              }
              <p><strong>Thành tiền:</strong> ${finalPrice.toLocaleString(
                "vi-VN"
              )} VNĐ</p>
            </div>
            
            <p>Hãy đến phòng gym và bắt đầu hành trình tập luyện của bạn! 💪</p>
            <p>Chúc bạn tập luyện hiệu quả!</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error(
        "Failed to send registration confirmation email:",
        emailError
      );
    }

    return res.status(201).json({
      message: "Đăng ký gói tập thành công",
      registration,
      summary: {
        memberName: member.fullName,
        packageName: packageData.name,
        duration: packageData.duration,
        startDate,
        endDate,
        originalPrice: packageData.price,
        discountAmount,
        finalPrice,
        paymentMethod,
      },
    });
  } catch (error) {
    console.error("Registration creation error:", error);
    return res.status(500).json({
      message: "Lỗi tạo đăng ký",
      error: error.message,
    });
  }
}

export async function listRegistrations(req, res) {
  try {
    const { memberId, status, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (memberId) filter.member_id = memberId;
    if (status) filter.status = status;

    const registrations = await PackageRegistration.find(filter)
      .populate("member_id", "fullName email phone")
      .populate("package_id", "name duration price features")
      .populate("discount_id", "name type value")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PackageRegistration.countDocuments(filter);

    return res.json({
      registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách đăng ký",
      error: error.message,
    });
  }
}

export async function getRegistrationById(req, res) {
  try {
    const { id } = req.params;

    const registration = await PackageRegistration.findById(id)
      .populate("member_id", "fullName email phone address")
      .populate("package_id", "name description duration price features")
      .populate("discount_id", "name type value");

    if (!registration) {
      return res.status(404).json({ message: "Không tìm thấy đăng ký" });
    }

    return res.json(registration);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy thông tin đăng ký",
      error: error.message,
    });
  }
}

export async function updateRegistrationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ["active", "suspended", "cancelled", "expired"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status không hợp lệ",
        validStatuses,
      });
    }

    const registration = await PackageRegistration.findByIdAndUpdate(
      id,
      {
        status,
        status_reason: reason,
        updated_at: new Date(),
      },
      { new: true }
    ).populate("member_id", "fullName email");

    if (!registration) {
      return res.status(404).json({ message: "Không tìm thấy đăng ký" });
    }

    return res.json({
      message: `Cập nhật trạng thái thành công: ${status}`,
      registration,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật trạng thái",
      error: error.message,
    });
  }
}

export async function getMemberActivePackages(req, res) {
  try {
    const { memberId } = req.params;

    const activePackages = await PackageRegistration.find({
      member_id: memberId,
      status: "active",
      end_date: { $gt: new Date() },
    })
      .populate("package_id", "name description duration price features")
      .populate("discount_id", "name type value")
      .sort({ createdAt: -1 });

    return res.json({
      member_id: memberId,
      activePackages,
      count: activePackages.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy gói đang hoạt động",
      error: error.message,
    });
  }
}
