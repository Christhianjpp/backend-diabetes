"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proposeCategory = proposeCategory;
const normalize_1 = require("../lib/normalize");
const note_category_1 = require("../models/note-category");
const note_category_alias_1 = require("../models/note-category-alias");
const note_category_proposa_1 = require("../models/note-category-proposa");
function proposeCategory(proposedName, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const normalized = (0, normalize_1.normalizeStr)(proposedName);
        // ¿Existe categoría o alias igual/similar?
        const existing = yield note_category_1.CategoryNoteModel.findOne({ normalized });
        const aliasHit = yield note_category_alias_1.CategoryNoteAliasModel.findOne({ normalized });
        if (existing || aliasHit) {
            // fusiona directamente con la existente
            const approvedCategoryId = (existing === null || existing === void 0 ? void 0 : existing._id) || aliasHit.categoryId;
            return note_category_proposa_1.CategoryNoteProposalModel.create({
                proposedName, normalized, status: "merged", approvedCategoryId, createdBy: userId, reason: "Alias/duplicada"
            });
        }
        // Heurística simple de “nombre seguro” para auto-aprobar (puedes ajustar)
        const isSafeGeneric = normalized.length >= 3 && !/tienda|promo|gratis|http|www/.test(normalized);
        if (isSafeGeneric) {
            const cat = yield note_category_1.CategoryNoteModel.create({
                name: proposedName.trim(),
                normalized,
                slug: (0, normalize_1.slugify)(proposedName),
                createdBy: userId
            });
            yield note_category_proposa_1.CategoryNoteProposalModel.create({
                proposedName, normalized, status: "approved", approvedCategoryId: cat._id, createdBy: userId
            });
            return cat;
        }
        // Dejar como pendiente (moderación manual o posterior)
        return note_category_proposa_1.CategoryNoteProposalModel.create({
            proposedName, normalized, status: "pending", createdBy: userId
        });
    });
}
//# sourceMappingURL=categories.js.map