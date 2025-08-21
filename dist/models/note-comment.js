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
const NoteCommentSchema = new mongoose_1.Schema({
    itemId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Note', required: true, index: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
NoteCommentSchema.methods.toJSON = function () {
    const _a = this.toObject(), { _id, createdAt } = _a, doc = __rest(_a, ["_id", "createdAt"]);
    return Object.assign(Object.assign({ id: _id }, doc), { createdAt: createdAt ? new Date(createdAt).getTime() : undefined });
};
exports.default = (0, mongoose_1.model)('NoteComment', NoteCommentSchema);
//# sourceMappingURL=note-comment.js.map