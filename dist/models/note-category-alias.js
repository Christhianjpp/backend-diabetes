"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryNoteAliasModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const normalize_1 = require("../lib/normalize");
const CategoryNoteAliasSchema = new mongoose_1.Schema({
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    alias: { type: String, required: true, minlength: 2, maxlength: 28 },
    normalized: { type: String, required: true, unique: true },
}, { timestamps: true });
CategoryNoteAliasSchema.pre("validate", function (next) {
    if (this.alias)
        this.normalized = (0, normalize_1.normalizeStr)(this.alias);
    next();
});
CategoryNoteAliasSchema.index({ normalized: 1 }, { unique: true });
CategoryNoteAliasSchema.index({ alias: "text" });
exports.CategoryNoteAliasModel = mongoose_1.default.models.CategoryNoteAlias || mongoose_1.default.model("CategoryNoteAlias", CategoryNoteAliasSchema);
//# sourceMappingURL=note-category-alias.js.map