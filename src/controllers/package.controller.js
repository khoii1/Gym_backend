import { PackageService } from "../services/package.service.js";

export async function createPackage(req, res) {
  try {
    const packageData = await PackageService.createPackage(req.body);
    return res.status(201).json({
      success: true,
      message: "Tạo gói tập thành công",
      data: packageData,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function listPackages(req, res) {
  try {
    const result = await PackageService.listPackages(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getPackageById(req, res) {
  try {
    const result = await PackageService.getPackageById(req.params.id);
    return res.json(result);
  } catch (error) {
    if (error.message === "Không tìm thấy gói tập này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function updatePackage(req, res) {
  try {
    const packageData = await PackageService.updatePackage(
      req.params.id,
      req.body
    );
    return res.json({
      success: true,
      message: "Cập nhật gói tập thành công",
      data: packageData,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy gói tập này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

export async function deletePackage(req, res) {
  try {
    const packageData = await PackageService.deletePackage(req.params.id);
    return res.json({
      success: true,
      message: "Xóa gói tập thành công",
    });
  } catch (error) {
    if (error.message === "Không tìm thấy gói tập này") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
