import Package from "../models/Package.js";

export async function createPackage(req, res) {
  const p = await Package.create(req.body);
  return res.status(201).json(p);
}

export async function listPackages(req, res) {
  const items = await Package.find().populate("discount_id", "code percent");
  return res.json(items);
}
