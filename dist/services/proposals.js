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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveProposal = resolveProposal;
const note_1 = __importDefault(require("../models/note"));
const note_category_proposa_1 = require("../models/note-category-proposa");
function resolveProposal(proposalId, action, targetCategoryId, reason) {
    return __awaiter(this, void 0, void 0, function* () {
        const p = yield note_category_proposa_1.CategoryNoteProposalModel.findById(proposalId);
        if (!p)
            throw new Error("Proposal no encontrada");
        if (action === "reject") {
            p.status = "rejected";
            p.reason = reason || "No cumple criterios";
            yield p.save();
            return p;
        }
        if ((action === "approve" || action === "merge") && !targetCategoryId) {
            throw new Error("Falta targetCategoryId para aprobar/mergear");
        }
        p.status = action === "approve" ? "approved" : "merged";
        p.approvedCategoryId = targetCategoryId;
        p.reason = reason;
        yield p.save();
        // migrar ítems del creador (o de todos si quieres) que apunten a esta pendingCategoryId
        yield note_1.default.updateMany({ pendingCategoryId: p._id }, { $set: { categoryId: p.approvedCategoryId }, $unset: { pendingCategoryId: "" } });
        return p;
    });
}
//# sourceMappingURL=proposals.js.map