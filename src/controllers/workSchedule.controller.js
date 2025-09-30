import WorkSchedule from "../models/WorkSchedule.js";

export async function createWorkSchedule(req, res) {
  const item = await WorkSchedule.create(req.body);
  return res.status(201).json(item);
}

export async function listWorkSchedules(req, res) {
  const items = await WorkSchedule.find().populate(
    "employee_id",
    "full_name role"
  );
  return res.json(items);
}
