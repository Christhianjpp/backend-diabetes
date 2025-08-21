import mongoose, { Schema, Types } from "mongoose";
import { normalizeStr } from "../lib/normalize";

export interface CategoryNoteAlias {
    _id: Types.ObjectId;
    categoryId: Types.ObjectId;
    alias: string;           // texto visible
    normalized: string;      // para comparación
    createdAt: Date;
    updatedAt: Date;
  }
  const CategoryNoteAliasSchema = new Schema<CategoryNoteAlias>({
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    alias: { type: String, required: true, minlength: 2, maxlength: 28 },
    normalized: { type: String, required: true, unique: true },
  }, { timestamps: true });
  
  CategoryNoteAliasSchema.pre("validate", function(next) {
    if (this.alias) this.normalized = normalizeStr(this.alias);
    next();
  });
  
  CategoryNoteAliasSchema.index({ normalized: 1 }, { unique: true });
  CategoryNoteAliasSchema.index({ alias: "text" });
  
  export const CategoryNoteAliasModel = mongoose.models.CategoryNoteAlias || mongoose.model<CategoryNoteAlias>("CategoryNoteAlias", CategoryNoteAliasSchema);
  