import Member from "../models/Member.js";

export async function createMember(req, res) {
  const m = await Member.create(req.body);
  return res.status(201).json(m);
}

export async function listMembers(req, res) {
  const items = await Member.find().lean();
  return res.json(items);
}
