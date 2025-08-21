import mongoose, { Schema, Types } from "mongoose";
import { normalizeStr } from "../lib/normalize";

export type ProposalStatus = "pending" | "approved" | "rejected" | "merged";

export interface CategoryNoteProposal {
  _id: Types.ObjectId;
  proposedName: string;
  normalized: string;
  status: ProposalStatus;
  approvedCategoryId?: Types.ObjectId; // si aprueba o se fusiona
  reason?: string;                      // motivo de rechazo/fusión
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
const CategoryNoteProposalSchema = new Schema<CategoryNoteProposal>({
  proposedName: { type: String, required: true, minlength: 2, maxlength: 28 },
  normalized: { type: String, required: true, index: true },
  status: { type: String, enum: ["pending","approved","rejected","merged"], default: "pending", index: true },
  approvedCategoryId: { type: Schema.Types.ObjectId, ref: "Category" },
  reason: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
}, { timestamps: true });

CategoryNoteProposalSchema.pre("validate", function(next) {
  if (this.proposedName) this.normalized = normalizeStr(this.proposedName);
  next();
});

// evitar duplicados exactos de propuestas pendientes del mismo usuario
CategoryNoteProposalSchema.index({ createdBy: 1, normalized: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "pending" } });

export const CategoryNoteProposalModel = mongoose.models.CategoryNoteProposal || mongoose.model<CategoryNoteProposal>("CategoryNoteProposal", CategoryNoteProposalSchema);
