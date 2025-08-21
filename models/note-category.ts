import mongoose, { Schema, Types } from "mongoose";
import { normalizeStr, slugify } from "../lib/normalize";
export interface Category {
  _id: Types.ObjectId;
  name: string;              // Visible
  normalized: string;        // Para comparación/búsquedas
  slug: string;              // URL/clave
  emoji?: string;
  color?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const CategoryNoteSchema = new Schema<Category>({
  name: { type: String, required: true, minlength: 2, maxlength: 28 },
  normalized: { type: String, required: true, index: true, unique: true },
  slug: { type: String, required: true, unique: true },
  emoji: String,
  color: String,
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

CategoryNoteSchema.pre("validate", function(next) {
  if (this.name) {
    this.normalized = normalizeStr(this.name);
    this.slug = this.slug || slugify(this.name);
  }
  next();
});

// Índices recomendados
CategoryNoteSchema.index({ normalized: 1 }, { unique: true });
CategoryNoteSchema.index({ name: "text" });

export const CategoryNoteModel = mongoose.models.CategoryNote || mongoose.model<Category>("CategoryNote", CategoryNoteSchema);

