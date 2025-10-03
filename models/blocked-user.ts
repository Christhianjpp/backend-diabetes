import { Schema, model } from 'mongoose';

export interface IBlockedUser {
  _id: string;
  blockerId: string;
  blockedUserId: string;
  blockedUserName: string;
  blockedUserImg?: string;
  reason?: string;
  createdAt: number;
}

const BlockedUserSchema = new Schema<IBlockedUser>({
  blockerId: {
    type: String,
    required: [true, 'Blocker ID is required'],
    ref: 'User',
  },
  blockedUserId: {
    type: String,
    required: [true, 'Blocked user ID is required'],
    ref: 'User',
  },
  blockedUserName: {
    type: String,
    required: [true, 'Blocked user name is required'],
  },
  blockedUserImg: {
    type: String,
  },
  reason: {
    type: String,
    maxlength: [200, 'Reason cannot exceed 200 characters'],
  },
  createdAt: {
    type: Number,
    required: [true, 'Created at is required'],
    default: Date.now,
  },
});

// Índices para optimizar consultas
BlockedUserSchema.index({ blockerId: 1, createdAt: -1 });
BlockedUserSchema.index({ blockedUserId: 1, createdAt: -1 });

// Evitar bloqueos duplicados del mismo usuario
BlockedUserSchema.index(
  { blockerId: 1, blockedUserId: 1 },
  { unique: true }
);

const BlockedUser = model<IBlockedUser>('BlockedUser', BlockedUserSchema);

export default BlockedUser;
