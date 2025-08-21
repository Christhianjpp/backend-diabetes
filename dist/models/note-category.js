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
exports.CategoryNoteModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const normalize_1 = require("../lib/normalize");
const CategoryNoteSchema = new mongoose_1.Schema({
    name: { type: String, required: true, minlength: 2, maxlength: 28 },
    normalized: { type: String, required: true, index: true, unique: true },
    slug: { type: String, required: true, unique: true },
    emoji: String,
    color: String,
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
CategoryNoteSchema.pre("validate", function (next) {
    if (this.name) {
        this.normalized = (0, normalize_1.normalizeStr)(this.name);
        this.slug = this.slug || (0, normalize_1.slugify)(this.name);
    }
    next();
});
// Índices recomendados
CategoryNoteSchema.index({ normalized: 1 }, { unique: true });
CategoryNoteSchema.index({ name: "text" });
exports.CategoryNoteModel = mongoose_1.default.models.CategoryNote || mongoose_1.default.model("CategoryNote", CategoryNoteSchema);
//# sourceMappingURL=note-category.js.map