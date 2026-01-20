const router = require("express").Router();
const transporter = require("../config/mailer");

router.post("/test-email", async (req, res) => {
  try {
    const { to } = req.body;

    if (!to || !String(to).trim()) {
      return res.status(400).json({ ok: false, message: "Missing 'to'" });
    }

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: String(to).trim(),
      subject: "Roomie · Test email (POST)",
      text: "Si lees esto, el email funciona 🚀",
    });

    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

