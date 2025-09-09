import { Schema, model, Types } from 'mongoose';
import { NoteCategory, NoteVisibility, PublicStats } from '../interfaces/note';

interface NoteDocument {
  userId: Types.ObjectId;
  title: string;
  isImportant: boolean;  // Renombrado: campo para el creador (anteriormente 'liked')
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
  publicStats: PublicStats;  // Requerido (no opcional)
  createdAt?: Date;
  updatedAt?: Date;
  
  // Campo virtual agregado por consultas con agregación
  isLikedByCurrentUser?: boolean;
}

const NoteSchema = new Schema<NoteDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  isImportant: { type: Boolean, required: true, default: false },  // Renombrado de 'liked'
  notes: { type: String },
  categoryId: { type: Schema.Types.ObjectId, ref: "CategoryNote", index: true },
  pendingCategoryId: { type: Schema.Types.ObjectId, ref: "CategoryProposal", index: true },
  tags: { type: [String], default: [] },
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
    likes: { type: Number, default: 0, min: 0 },      // Agregado validación mínima
    comments: { type: Number, default: 0, min: 0 },   // Agregado validación mínima
    views: { type: Number, default: 0, min: 0 },      // Nuevo: contador de vistas
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
  const { _id, createdAt, updatedAt, ...note } = (this as any).toObject({ virtuals: true });
  return {
    id: _id,
    ...note,
    createdAt: createdAt ? new Date(createdAt).getTime() : undefined,
    updatedAt: updatedAt ? new Date(updatedAt).getTime() : undefined,
  };
};

export default model<NoteDocument>('Note', NoteSchema);


