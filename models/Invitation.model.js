
const { Schema, model } = require("mongoose");

const invitationSchema = new Schema(
  {
    flat: { type: Schema.Types.ObjectId, ref: "Flat", required: true },

    // who is being invited
    email: { type: String, required: true, lowercase: true, trim: true },

    // who sent it
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // store ONLY a hash of the token (never store raw token)
    tokenHash: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["pending", "accepted", "revoked", "expired"],
      default: "pending",
    },

    expiresAt: { type: Date, required: true },

    acceptedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// helpful indexes
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

module.exports = model("Invitation", invitationSchema);
