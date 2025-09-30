import Discount from "../models/Discount.js";

export async function createDiscount(req, res) {
  const d = await Discount.create(req.body);
  return res.status(201).json(d);
}

export async function listDiscounts(req, res) {
  const items = await Discount.find().lean();
  return res.json(items);
}
