const router = require("express").Router();
const transporter = require("../config/mailer");

router.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: "avalenciacs@gmail.com",
      subject: "Roomie · Test email",
      text: "Si lees esto, el email funciona 🚀",
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: err.message,
    });
  }
});

router.post("/test-email", async (req, res) => {
  const { to } = req.body;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: "Roomie · Test email",
      text: "Correo enviado desde Postman",
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;