const router = require("express").Router();
const mongoose = require("mongoose");

const { isAuthenticated } = require("../middleware/jwt.middleware");
const Flat = require("../models/Flat.model");
const User = require("../models/User.model");
const Invitation = require("../models/Invitation.model");

const transporter = require("../config/mailer");
const {
  generateInviteToken,
  hashToken,
  isExpired,
} = require("../utils/invitations");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const INVITE_TTL_HOURS = Number(process.env.INVITE_TTL_HOURS || 48);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ─────────────────────────────
// GET /api/invitations?flatId=... (solo owner)  NUEVO
// Devuelve invitaciones pendientes del flat
// ─────────────────────────────
router.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId } = req.query;
    const ownerId = req.payload._id;

    if (!flatId || !isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }

    const flat = await Flat.findById(flatId).lean();
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (String(flat.owner) !== String(ownerId)) {
      return res.status(403).json({ message: "Only owner can view invitations" });
    }

    const invites = await Invitation.find({
      flat: flatId,
      status: "pending",
    })
      .select("_id email status expiresAt createdAt invitedBy")
      .sort({ createdAt: -1 })
      .lean();

    res.json(invites);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────
// POST /api/invitations (solo owner) YA TENÍAS
// Envía email y crea invitación
// ─────────────────────────────
router.post("/", isAuthenticated, async (req, res, next) => {
  try {
    const { flatId, email } = req.body;
    const ownerId = req.payload._id;

    if (!isValidObjectId(flatId)) {
      return res.status(400).json({ message: "Invalid flat id" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const flat = await Flat.findById(flatId).populate("members", "email name");
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (String(flat.owner) !== String(ownerId)) {
      return res.status(403).json({ message: "Only owner can invite members" });
    }

    const alreadyMember = flat.members.some(
      (m) => String(m.email).toLowerCase() === cleanEmail
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "This email is already a member" });
    }

    // revocar invitaciones pendientes anteriores a ese email
    await Invitation.updateMany(
      { flat: flatId, email: cleanEmail, status: "pending" },
      { $set: { status: "revoked" } }
    );

    const rawToken = generateInviteToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    const invite = await Invitation.create({
      flat: flatId,
      email: cleanEmail,
      invitedBy: ownerId,
      tokenHash,
      expiresAt,
      status: "pending",
    });

    const inviteLink = `${CLIENT_URL}/invite/${rawToken}`;

    const ownerUser = await User.findById(ownerId).lean();
    const ownerName = ownerUser?.name || ownerUser?.email || "Owner";

    console.log("[INVITE] sending to:", cleanEmail);
    console.log("[INVITE] MAIL_FROM:", process.env.MAIL_FROM);
    console.log("[INVITE] CLIENT_URL:", CLIENT_URL);
    console.log("[INVITE] inviteLink:", inviteLink);

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: cleanEmail,
      subject: `Roomie · Invitation to join "${flat.name}"`,
      text:
        `You were invited by ${ownerName} to join the flat "${flat.name}".\n\n` +
        `Open this link to accept:\n${inviteLink}\n\n` +
        `This invitation expires in ${INVITE_TTL_HOURS} hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.4;">
          <h2 style="margin:0 0 12px;">You're invited</h2>
          <p style="margin:0 0 12px;">
            <b>${ownerName}</b> invited you to join:
            <b>${flat.name}</b>
          </p>
          <p style="margin:0 0 16px;">
            <a href="${inviteLink}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#0f172a;color:#fff;text-decoration:none;">
              Accept invitation
            </a>
          </p>
          <p style="margin:0;color:#64748b;font-size:12px;">
            Link expires in ${INVITE_TTL_HOURS} hours.
          </p>
        </div>
      `,
    });

    console.log("[INVITE] email sent, messageId:", info.messageId);

    res.status(201).json({
      ok: true,
      invitationId: invite._id,
      expiresAt: invite.expiresAt,
      messageId: info.messageId,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────
// POST /api/invitations/:invitationId/revoke (solo owner) NUEVO
// ─────────────────────────────
router.post("/:invitationId/revoke", isAuthenticated, async (req, res, next) => {
  try {
    const { invitationId } = req.params;
    const ownerId = req.payload._id;

    if (!isValidObjectId(invitationId)) {
      return res.status(400).json({ message: "Invalid invitation id" });
    }

    const invite = await Invitation.findById(invitationId);
    if (!invite) return res.status(404).json({ message: "Invitation not found" });

    const flat = await Flat.findById(invite.flat).lean();
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    if (String(flat.owner) !== String(ownerId)) {
      return res.status(403).json({ message: "Only owner can revoke invitations" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: `Invitation is ${invite.status}` });
    }

    invite.status = "revoked";
    await invite.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────
// POST /api/invitations/accept (usuario logueado) YA TENÍAS
// ─────────────────────────────
router.post("/accept", isAuthenticated, async (req, res, next) => {
  try {
    const { token } = req.body;
    const userId = req.payload._id;
    const userEmail = (req.payload.email || "").toLowerCase();

    if (!token || !String(token).trim()) {
      return res.status(400).json({ message: "Token is required" });
    }

    const tokenHash = hashToken(String(token).trim());

    const invite = await Invitation.findOne({ tokenHash });
    if (!invite) return res.status(404).json({ message: "Invitation not found" });

    if (invite.status !== "pending") {
      return res.status(400).json({ message: `Invitation is ${invite.status}` });
    }

    if (isExpired(invite)) {
      await Invitation.updateOne({ _id: invite._id }, { $set: { status: "expired" } });
      return res.status(400).json({ message: "Invitation expired" });
    }

    if (invite.email !== userEmail) {
      return res.status(403).json({
        message: `This invitation was sent to ${invite.email}. You are logged in as ${userEmail}.`,
      });
    }

    const flat = await Flat.findById(invite.flat);
    if (!flat) return res.status(404).json({ message: "Flat not found" });

    const isMember = flat.members.map(String).includes(String(userId));
    if (!isMember) {
      flat.members.push(userId);
      await flat.save();
    }

    invite.status = "accepted";
    invite.acceptedBy = userId;
    invite.acceptedAt = new Date();
    await invite.save();

    res.json({ ok: true, flatId: flat._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
