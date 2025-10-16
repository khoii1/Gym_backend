import PackageRegistration from "../models/PackageRegistration.js";
import Member from "../models/Member.js";
import Package from "../models/Package.js";
import Discount from "../models/Discount.js";
import { sendMail } from "./email.service.js";

export class RegistrationService {
  static async createRegistration(registrationData) {
    try {
      const {
        memberId,
        packageId,
        discountId,
        paymentMethod = "cash",
      } = registrationData;

      // 1. Validate member exists
      const member = await Member.findById(memberId);
      if (!member) {
        throw new Error("Không tìm thấy thành viên này");
      }

      // 2. Validate package exists and is active
      const packageData = await Package.findById(packageId);
      if (!packageData) {
        throw new Error("Không tìm thấy gói tập này");
      }

      // 3. Check for existing active registration
      const existingRegistration = await PackageRegistration.findOne({
        member_id: memberId,
        end_date: { $gt: new Date() },
      });

      if (existingRegistration) {
        const error = new Error("Thành viên đã có gói tập đang hoạt động");
        error.activePackage = existingRegistration;
        throw error;
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
        console.error("Gửi email xác nhận đăng ký thất bại:", emailError);
      }

      return {
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
      };
    } catch (error) {
      if (
        error.message === "Không tìm thấy thành viên này" ||
        error.message === "Không tìm thấy gói tập này" ||
        error.message === "Thành viên đã có gói tập đang hoạt động"
      ) {
        throw error;
      }
      throw new Error(`Có lỗi xảy ra khi đăng ký gói tập: ${error.message}`);
    }
  }

  static async listRegistrations(queryParams) {
    try {
      const { memberId, status, page = 1, limit = 10 } = queryParams;

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

      return {
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Có lỗi xảy ra khi tải danh sách đăng ký: ${error.message}`
      );
    }
  }

  static async getRegistrationById(registrationId) {
    try {
      const registration = await PackageRegistration.findById(registrationId)
        .populate("member_id", "fullName email phone address")
        .populate("package_id", "name description duration price features")
        .populate("discount_id", "name type value");

      if (!registration) {
        throw new Error("Không tìm thấy đăng ký này");
      }

      return registration;
    } catch (error) {
      if (error.message === "Không tìm thấy đăng ký này") {
        throw error;
      }
      throw new Error(
        `Có lỗi xảy ra khi tải thông tin đăng ký: ${error.message}`
      );
    }
  }

  static async updateRegistrationStatus(registrationId, statusData) {
    try {
      const { status, reason } = statusData;

      const validStatuses = ["active", "suspended", "cancelled", "expired"];
      if (!validStatuses.includes(status)) {
        const error = new Error("Trạng thái không hợp lệ");
        error.validStatuses = validStatuses;
        throw error;
      }

      const registration = await PackageRegistration.findByIdAndUpdate(
        registrationId,
        {
          status,
          status_reason: reason,
          updated_at: new Date(),
        },
        { new: true }
      ).populate("member_id", "fullName email");

      if (!registration) {
        throw new Error("Không tìm thấy đăng ký này");
      }

      return registration;
    } catch (error) {
      if (
        error.message === "Trạng thái không hợp lệ" ||
        error.message === "Không tìm thấy đăng ký này"
      ) {
        throw error;
      }
      throw new Error(
        `Có lỗi xảy ra khi cập nhật trạng thái: ${error.message}`
      );
    }
  }

  static async getMemberActivePackages(memberId) {
    try {
      const activePackages = await PackageRegistration.find({
        member_id: memberId,
        status: "active",
        end_date: { $gt: new Date() },
      })
        .populate("package_id", "name description duration price features")
        .populate("discount_id", "name type value")
        .sort({ createdAt: -1 });

      return {
        member_id: memberId,
        activePackages,
        count: activePackages.length,
      };
    } catch (error) {
      throw new Error(
        `Có lỗi xảy ra khi tải danh sách gói tập đang hoạt động: ${error.message}`
      );
    }
  }
}
