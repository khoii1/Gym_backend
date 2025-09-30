import Attendance from "../models/Attendance.js";

export async function checkin(req, res) {
  const { member_id, registration_id, note } = req.body;
  const data = await Attendance.create({
    member_id,
    registration_id,
    note,
    checkin_time: new Date(),
  });
  return res.status(201).json(data);
}

export async function listAttendance(req, res) {
  const items = await Attendance.find()
    .populate("member_id", "full_name")
    .populate("registration_id");
  return res.json(items);
}
