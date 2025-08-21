import { Schema, model, Types } from 'mongoose';

interface NoteCommentDocument {
  itemId: Types.ObjectId;
  userId: Types.ObjectId;
  text: string;
  createdAt?: Date;
}

const NoteCommentSchema = new Schema<NoteCommentDocument>({
  itemId: { type: Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

NoteCommentSchema.methods.toJSON = function () {
  const { _id, createdAt, ...doc } = (this as any).toObject();
  return {
    id: _id,
    ...doc,
    createdAt: createdAt ? new Date(createdAt).getTime() : undefined,
  };
};

export default model<NoteCommentDocument>('NoteComment', NoteCommentSchema);


