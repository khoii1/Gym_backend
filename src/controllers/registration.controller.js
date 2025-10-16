import { RegistrationService } from "../services/registration.service.js";

export async function createRegistration(req, res) {
  try {
    const result = await RegistrationService.createRegistration(req.body);
    return res.status(201).json({
      message: "Đăng ký gói tập thành công",
      ...result,
    });
  } catch (error) {
    if (
      error.message === "Không tìm thấy thành viên này" ||
      error.message === "Không tìm thấy gói tập này"
    ) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === "Thành viên đã có gói tập đang hoạt động") {
      return res.status(400).json({
        message: error.message,
        activePackage: error.activePackage,
      });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function listRegistrations(req, res) {
  try {
    const result = await RegistrationService.listRegistrations(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function getRegistrationById(req, res) {
  try {
    const { id } = req.params;
    const registration = await RegistrationService.getRegistrationById(id);
    return res.json(registration);
  } catch (error) {
    if (error.message === "Không tìm thấy đăng ký này") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function updateRegistrationStatus(req, res) {
  try {
    const { id } = req.params;
    const registration = await RegistrationService.updateRegistrationStatus(
      id,
      req.body
    );
    return res.json({
      message: `Cập nhật trạng thái thành công: ${req.body.status}`,
      registration,
    });
  } catch (error) {
    if (error.message === "Trạng thái không hợp lệ") {
      return res.status(400).json({
        message: error.message,
        validStatuses: error.validStatuses,
      });
    }
    if (error.message === "Không tìm thấy đăng ký này") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      message: error.message,
    });
  }
}

export async function getMemberActivePackages(req, res) {
  try {
    const { memberId } = req.params;
    const result = await RegistrationService.getMemberActivePackages(memberId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
