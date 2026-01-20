const nodemailer = require("nodemailer");

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP env vars missing (SMTP_HOST/SMTP_USER/SMTP_PASS)");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendInviteEmail({ to, flatName, inviterName, inviteUrl }) {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const transporter = createTransporter();

  const subject = `Roomie invitation: join "${flatName}"`;

  const text = [
    `You have been invited to join "${flatName}" on Roomie.`,
    inviterName ? `Invited by: ${inviterName}` : "",
    "",
    `Open this link to join:`,
    inviteUrl,
    "",
    `If you don't have an account, create one with this email (${to}) and you will be added automatically.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.4;">
      <h2 style="margin: 0 0 12px;">You're invited to Roomie</h2>
      <p>You have been invited to join <b>${escapeHtml(flatName)}</b>.</p>
      ${
        inviterName
          ? `<p>Invited by: <b>${escapeHtml(inviterName)}</b></p>`
          : ""
      }
      <p>
        <a href="${inviteUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0f172a;color:white;text-decoration:none;">
          Accept invitation
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;">
        If you don't have an account, create one with this email (${escapeHtml(
          to
        )}) and you will be added automatically.
      </p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, text, html });
}

module.exports = { sendInviteEmail };
