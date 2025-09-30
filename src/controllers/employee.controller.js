import Employee from "../models/Employee.js";

export async function createEmployee(req, res) {
  const employee = await Employee.create(req.body);
  return res.status(201).json(employee);
}

export async function listEmployees(req, res) {
  const employees = await Employee.find().lean();
  return res.json(employees);
}

export async function getEmployee(req, res) {
  const employee = await Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ message: "Không tìm thấy" });
  return res.json(employee);
}

export async function updateEmployee(req, res) {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!employee) return res.status(404).json({ message: "Không tìm thấy" });
  return res.json(employee);
}

export async function deleteEmployee(req, res) {
  const del = await Employee.findByIdAndDelete(req.params.id);
  if (!del) return res.status(404).json({ message: "Không tìm thấy" });
  return res.json({ message: "Đã xóa" });
}
