import note from "../models/note";
import { CategoryNoteProposalModel } from "../models/note-category-proposa";
import { CategoryNoteModel } from "../models/note-category";
import { slugify } from "../lib/normalize";

export async function resolveProposal(proposalId: string, action: "approve"|"merge"|"reject", targetCategoryId?: string, reason?: string) {
  const p = await CategoryNoteProposalModel.findById(proposalId);
  if (!p) throw new Error("Proposal no encontrada");

  if (action === "reject") {
    p.status = "rejected"; p.reason = reason || "No cumple criterios"; await p.save(); return p;
  }

  // Si se aprueba sin target, creamos nueva categoría con el nombre propuesto
  if (action === "approve" && !targetCategoryId) {
    const created = await CategoryNoteModel.create({
      name: p.proposedName,
      normalized: p.normalized,
      slug: slugify(p.proposedName),
      createdBy: p.createdBy as any
    });
    targetCategoryId = String(created._id);
  }

  if ((action === "approve" || action === "merge") && !targetCategoryId) {
    throw new Error("Falta targetCategoryId para aprobar/mergear");
  }

  p.status = action === "approve" ? "approved" : "merged";
  p.approvedCategoryId = targetCategoryId as any;
  p.reason = reason;
  await p.save();

  // migrar ítems del creador (o de todos si quieres) que apunten a esta pendingCategoryId
  await note.updateMany(
    { pendingCategoryId: p._id },
    { $set: { categoryId: p.approvedCategoryId }, $unset: { pendingCategoryId: "" } }
  );

  return p;
}
