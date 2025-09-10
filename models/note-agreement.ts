import { Schema, model, Types } from 'mongoose';

interface NoteAgreementDocument {
  noteId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt?: Date;
}

const NoteAgreementSchema = new Schema<NoteAgreementDocument>({
  noteId: { type: Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

// Índice compuesto único
NoteAgreementSchema.index({ noteId: 1, userId: 1 }, { unique: true });

NoteAgreementSchema.methods.toJSON = function () {
  const { _id, createdAt, ...doc } = (this as any).toObject();
  return {
    id: _id,
    ...doc,
    createdAt: createdAt ? new Date(createdAt).getTime() : undefined,
  };
};

export default model<NoteAgreementDocument>('NoteAgreement', NoteAgreementSchema);


