import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: Object
  },
  { timestamps: true }
);

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
