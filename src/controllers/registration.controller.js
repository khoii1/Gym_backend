import PackageRegistration from "../models/PackageRegistration.js";

export async function createRegistration(req, res) {
  const reg = await PackageRegistration.create(req.body);
  return res.status(201).json(reg);
}

export async function listRegistrations(req, res) {
  const items = await PackageRegistration.find()
    .populate("member_id", "full_name")
    .populate("package_id", "name code")
    .populate("discount_id", "code percent");
  return res.json(items);
}
