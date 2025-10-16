import Package from "../models/Package.js";

export class PackageService {
  static async createPackage(packageData) {
    try {
      const newPackage = await Package.create(packageData);
      return newPackage;
    } catch (error) {
      throw new Error(
        `Không thể tạo gói tập. Vui lòng kiểm tra lại thông tin: ${error.message}`
      );
    }
  }

  static async listPackages(queryParams) {
    try {
      const { status, minPrice, maxPrice, limit = 20, page = 1 } = queryParams;

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

      return {
        success: true,
        data: packages,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / Number(limit)),
          totalItems: total,
          itemsPerPage: Number(limit),
        },
      };
    } catch (error) {
      throw new Error(
        `Có lỗi xảy ra khi tải danh sách gói tập: ${error.message}`
      );
    }
  }

  static async getPackageById(packageId) {
    try {
      const packageData = await Package.findById(packageId);

      if (!packageData) {
        throw new Error("Không tìm thấy gói tập này");
      }

      return {
        success: true,
        data: packageData,
      };
    } catch (error) {
      if (error.message === "Không tìm thấy gói tập này") {
        throw error;
      }
      throw new Error(
        `Có lỗi xảy ra khi tải thông tin gói tập: ${error.message}`
      );
    }
  }

  static async updatePackage(packageId, updateData) {
    try {
      const packageData = await Package.findByIdAndUpdate(
        packageId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!packageData) {
        throw new Error("Không tìm thấy gói tập này");
      }

      return packageData;
    } catch (error) {
      if (error.message === "Không tìm thấy gói tập này") {
        throw error;
      }
      throw new Error(
        `Không thể cập nhật gói tập. Vui lòng kiểm tra lại thông tin: ${error.message}`
      );
    }
  }

  static async deletePackage(packageId) {
    try {
      const packageData = await Package.findByIdAndDelete(packageId);

      if (!packageData) {
        throw new Error("Không tìm thấy gói tập này");
      }

      return packageData;
    } catch (error) {
      if (error.message === "Không tìm thấy gói tập này") {
        throw error;
      }
      throw new Error(`Có lỗi xảy ra khi xóa gói tập: ${error.message}`);
    }
  }
}
