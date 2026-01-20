const crypto = require("crypto");

function generateInviteToken() {
  // 32 bytes => 64 hex chars
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function isExpired(invite) {
  return !invite?.expiresAt || new Date(invite.expiresAt).getTime() < Date.now();
}

module.exports = { generateInviteToken, hashToken, isExpired };
