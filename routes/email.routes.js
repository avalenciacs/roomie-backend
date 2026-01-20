const router = require("express").Router();
const transporter = require("../config/mailer");

router.post("/test-email", async (req, res) => {
  try {
    const { to } = req.body;

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: to || process.env.SMTP_USER,
      subject: "Roomie · Test email",
      text: "Si lees esto, el email funciona 🚀",
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
