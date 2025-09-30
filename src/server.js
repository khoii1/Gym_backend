import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import workScheduleRoutes from "./routes/workSchedule.routes.js";
import memberRoutes from "./routes/member.routes.js";
import discountRoutes from "./routes/discount.routes.js";
import packageRoutes from "./routes/package.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import { transporter } from "./config/mailer.js";
import debugRoutes from "./routes/debug.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.get("/", (req, res) => res.json({ message: "GYM API đang chạy" }));

// Nếu KHÔNG dùng SendGrid API, mới kiểm tra kết nối SMTP để phát hiện lỗi cấu hình sớm
if (!process.env.SENDGRID_API_KEY) {
  (async () => {
    try {
      await transporter.verify();
      console.log("📧 SMTP đã sẵn sàng (verify OK)");
    } catch (err) {
      console.warn(
        "⚠️ Không thể kết nối SMTP, vui lòng kiểm tra MAIL_HOST/PORT/SECURE/USER/PASS:",
        err?.message || err
      );
    }
  })();
}

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/work-schedules", workScheduleRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/attendance", attendanceRoutes);
// Chỉ mở route debug khi không phải production
if (process.env.NODE_ENV !== "production") {
  app.use("/api/debug", debugRoutes);
}

const PORT = process.env.PORT || 4000;

connectDB(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
  });
});
