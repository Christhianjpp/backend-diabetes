"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const NoteSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    liked: { type: Boolean, required: true },
    notes: { type: String },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Category", index: true },
    pendingCategoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: "CategoryProposal", index: true }, tags: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    place: {
        name: { type: String },
        address: { type: String },
        lat: { type: Number },
        lng: { type: Number },
    },
    product: {
        barcode: { type: String },
        brand: { type: String },
    },
    visibility: { type: String, enum: ['private', 'public'], default: 'private', index: true },
    remindAt: { type: Number },
    publicStats: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
    },
}, { timestamps: true, versionKey: false });
// Reglas de consistencia básicas (lógica de app valida más):
NoteSchema.pre("validate", function (next) {
    // No permitir ambos campos simultáneamente llenos (app debería migrar cuando se apruebe)
    if (this.categoryId && this.pendingCategoryId) {
        return next(new Error("Item no puede tener categoryId y pendingCategoryId a la vez."));
    }
    next();
});
NoteSchema.methods.toJSON = function () {
    const _a = this.toObject(), { _id, createdAt, updatedAt } = _a, note = __rest(_a, ["_id", "createdAt", "updatedAt"]);
    return Object.assign(Object.assign({ id: _id }, note), { createdAt: createdAt ? new Date(createdAt).getTime() : undefined, updatedAt: updatedAt ? new Date(updatedAt).getTime() : undefined });
};
exports.default = (0, mongoose_1.model)('Note', NoteSchema);
//# sourceMappingURL=note.js.map