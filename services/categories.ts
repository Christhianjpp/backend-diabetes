
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

  // Heurística simple de “nombre seguro” para auto-aprobar (puedes ajustar)
  const isSafeGeneric = normalized.length >= 3 && !/tienda|promo|gratis|http|www/.test(normalized);

  if (isSafeGeneric) {
    const cat = await CategoryNoteModel.create({
      name: proposedName.trim(),
      normalized,
      slug: slugify(proposedName),
      createdBy: userId
    });
    await CategoryNoteProposalModel.create({
      proposedName, normalized, status: "approved", approvedCategoryId: cat._id, createdBy: userId
    });
    return cat;
  }

  // Dejar como pendiente (moderación manual o posterior)
  return CategoryNoteProposalModel.create({
    proposedName, normalized, status: "pending", createdBy: userId
  });
}
