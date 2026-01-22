const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,        // ✅ obligatorio para 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // APP PASSWORD
  },
  requireTLS: true,
});

// Opcional pero recomendado para debug
transporter.verify((err) => {
  if (err) {
    console.error("SMTP verification failed:", err);
  } else {
    console.log("SMTP ready");
  }
});

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

  const subject = `Roomie invitation: join "${flatName}"`;

  const text = [
    `You have been invited to join "${flatName}" on Roomie.`,
    inviterName ? `Invited by: ${inviterName}` : "",
    "",
    `Open this link to join:`,
    inviteUrl,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>You're invited to Roomie</h2>
      <p>You have been invited to join <b>${escapeHtml(flatName)}</b>.</p>
      ${
        inviterName
          ? `<p>Invited by: <b>${escapeHtml(inviterName)}</b></p>`
          : ""
      }
      <p>
        <a href="${inviteUrl}"
           style="padding:10px 14px;border-radius:10px;background:#0f172a;color:white;text-decoration:none;">
          Accept invitation
        </a>
      </p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, text, html });
}

module.exports = { sendInviteEmail };
