import { Schema, model, Types } from 'mongoose';
import { NoteCategory, NoteVisibility, PublicStats } from '../interfaces/note';

interface NoteDocument {
  userId: Types.ObjectId;
  title: string;
  liked: boolean;
  notes?: string;
  categoryId?: Types.ObjectId;          // categoría aprobada
  pendingCategoryId?: Types.ObjectId;   // referencia a propuesta
  tags?: string[];
  photos?: string[];
  place?: {
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
  };
  product?: {
    barcode?: string;
    brand?: string;
  };
  visibility: NoteVisibility;
  remindAt?: number;
  publicStats?: PublicStats;
  createdAt?: Date;
  updatedAt?: Date;
}

const NoteSchema = new Schema<NoteDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  liked: { type: Boolean, required: true },
  notes: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", index: true },
  pendingCategoryId: { type: Schema.Types.ObjectId, ref: "CategoryProposal", index: true },  tags: { type: [String], default: [] },
  photos: { type: [String], default: [] },
  place: {
    name: { type: String },
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number },
  },
  product: {
    barcode: { type: String },
    brand: { type: String },
  },
  visibility: { type: String, enum: ['private', 'public'], default: 'private', index: true },
  remindAt: { type: Number },
  publicStats: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
  },
}, { timestamps: true, versionKey: false });

// Reglas de consistencia básicas (lógica de app valida más):
NoteSchema.pre("validate", function(next) {
  // No permitir ambos campos simultáneamente llenos (app debería migrar cuando se apruebe)
  if (this.categoryId && this.pendingCategoryId) {
    return next(new Error("Item no puede tener categoryId y pendingCategoryId a la vez."));
  }
  next();
});

NoteSchema.methods.toJSON = function () {
  const { _id, createdAt, updatedAt, ...note } = (this as any).toObject();
  return {
    id: _id,
    ...note,
    createdAt: createdAt ? new Date(createdAt).getTime() : undefined,
    updatedAt: updatedAt ? new Date(updatedAt).getTime() : undefined,
  };
};

export default model<NoteDocument>('Note', NoteSchema);


