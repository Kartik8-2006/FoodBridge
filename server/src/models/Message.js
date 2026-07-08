import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Index to optimize chat queries
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ recipient: 1, sender: 1 });

export const Message = mongoose.model('Message', messageSchema);
