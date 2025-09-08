
import { normalizeStr, slugify } from "../lib/normalize";
import type { Types } from "mongoose";
import { CategoryNoteModel } from "../models/note-category";
import { CategoryNoteAliasModel } from "../models/note-category-alias";
import { CategoryNoteProposalModel } from "../models/note-category-proposa";

export async function proposeCategory(proposedName: string, userId: Types.ObjectId) {
  const normalized = normalizeStr(proposedName);

  // ¿Existe categoría o alias igual/similar?
  const existing = await CategoryNoteModel.findOne({ normalized });
  const aliasHit = await CategoryNoteAliasModel.findOne({ normalized });

  if (existing || aliasHit) {
    // fusiona directamente con la existente
    const approvedCategoryId = existing?._id || aliasHit!.categoryId;
    return CategoryNoteProposalModel.create({
      proposedName, normalized, status: "merged", approvedCategoryId, createdBy: userId, reason: "Alias/duplicada"
    });
  }

  // Dejar como pendiente (moderación por administrador). El usuario podrá
  // usarla en sus notas mediante pendingCategoryId hasta que sea aprobada.
  return CategoryNoteProposalModel.create({
    proposedName, normalized, status: "pending", createdBy: userId
  });
}
