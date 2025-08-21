import { Schema, model, Types } from 'mongoose';

interface NoteLikeDocument {
  itemId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt?: Date;
}

const NoteLikeSchema = new Schema<NoteLikeDocument>({
  itemId: { type: Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

NoteLikeSchema.index({ itemId: 1, userId: 1 }, { unique: true });

NoteLikeSchema.methods.toJSON = function () {
  const { _id, createdAt, ...doc } = (this as any).toObject();
  return {
    id: _id,
    ...doc,
    createdAt: createdAt ? new Date(createdAt).getTime() : undefined,
  };
};

export default model<NoteLikeDocument>('NoteLike', NoteLikeSchema);


