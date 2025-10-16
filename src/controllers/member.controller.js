import { MemberService } from "../services/member.service.js";

export async function createMember(req, res) {
  try {
    const member = await MemberService.createMember(req.body);
    return res.status(201).json({
      message: "Tạo thành viên thành công",
      member,
    });
  } catch (error) {
    if (error.message === "Email đã được sử dụng") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Có lỗi xảy ra khi tạo thành viên",
      error: error.message,
    });
  }
}

export async function listMembers(req, res) {
  try {
    const result = await MemberService.listMembers(req.query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      message: "Có lỗi xảy ra khi tải danh sách thành viên",
      error: error.message,
    });
  }
}

export async function getMemberById(req, res) {
  try {
    const { id } = req.params;
    const result = await MemberService.getMemberById(id);
    return res.json(result);
  } catch (error) {
    if (error.message === "Không tìm thấy thành viên này") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Có lỗi xảy ra khi tải thông tin thành viên",
      error: error.message,
    });
  }
}

export async function updateMember(req, res) {
  try {
    const { id } = req.params;
    const member = await MemberService.updateMember(id, req.body);
    return res.json({
      message: "Cập nhật thông tin thành viên thành công",
      member,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy thành viên này") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Có lỗi xảy ra khi cập nhật thông tin thành viên",
      error: error.message,
    });
  }
}

export async function deleteMember(req, res) {
  try {
    const { id } = req.params;
    const member = await MemberService.deleteMember(id);
    return res.json({
      message: "Xóa thành viên thành công",
      deletedMember: member.fullName,
    });
  } catch (error) {
    if (
      error.message === "Không thể xóa thành viên có gói tập đang hoạt động"
    ) {
      return res.status(400).json({
        message: error.message,
        activePackages: error.activePackages,
      });
    }
    if (error.message === "Không tìm thấy thành viên này") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Có lỗi xảy ra khi xóa thành viên",
      error: error.message,
    });
  }
}

export async function getMemberActivePackages(req, res) {
  try {
    const { id } = req.params;
    const result = await MemberService.getMemberActivePackages(id);
    return res.json(result);
  } catch (error) {
    if (error.message === "Không tìm thấy thành viên này") {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({
      message: "Có lỗi xảy ra khi tải danh sách gói tập đang hoạt động",
      error: error.message,
    });
  }
}
