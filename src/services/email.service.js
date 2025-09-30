import { transporter } from "../config/mailer.js";
import sgMail from "@sendgrid/mail";

const USE_SENDGRID = Boolean(process.env.SENDGRID_API_KEY);
if (USE_SENDGRID) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (err) {
    console.warn(
      "⚠️ SENDGRID_API_KEY không hợp lệ hoặc chưa cài đặt @sendgrid/mail:",
      err?.message || err
    );
  }
}

/**
 * Gửi email HTML đơn giản.
 */
export async function sendMail({ to, subject, html }) {
  const fromEmail = process.env.MAIL_FROM || process.env.MAIL_USER;
  const appName = process.env.APP_NAME || "App";

  if (USE_SENDGRID && process.env.SENDGRID_API_KEY) {
    const msg = {
      to,
      from: { email: fromEmail, name: appName },
      subject,
      html,
    };
    const [response] = await sgMail.send(msg);
    return response;
  }

  const info = await transporter.sendMail({
    from: `${appName} <${fromEmail}>`,
    to,
    subject,
    html,
  });
  return info;
}
