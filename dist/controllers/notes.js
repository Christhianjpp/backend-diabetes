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
exports.deleteComment = exports.getComments = exports.addComment = exports.unlikeNote = exports.likeNote = exports.deleteNote = exports.updateNote = exports.getNoteById = exports.getPublicNotes = exports.getMyNotes = exports.createNote = void 0;
const mongoose_1 = require("mongoose");
const note_1 = __importDefault(require("../models/note"));
const note_like_1 = __importDefault(require("../models/note-like"));
const note_comment_1 = __importDefault(require("../models/note-comment"));
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { title, liked, notes, category, tags, photos, place, product, visibility, remindAt, } = req.body;
        if (!title || typeof liked !== 'boolean' || !visibility) {
            res.status(400).json({ message: 'title, liked and visibility are required' });
            return;
        }
        const newNote = yield note_1.default.create({
            userId: user._id,
            title,
            liked,
            notes,
            category,
            tags,
            photos,
            place,
            product,
            visibility,
            remindAt,
        });
        res.status(201).json(newNote);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createNote = createNote;
const getMyNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const notes = yield note_1.default.find({ userId: user._id }).sort({ updatedAt: -1 });
        res.json(notes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getMyNotes = getMyNotes;
const getPublicNotes = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notes = yield note_1.default.find({ visibility: 'public' }).sort({ updatedAt: -1 });
        res.json(notes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPublicNotes = getPublicNotes;
const getNoteById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const note = yield note_1.default.findById(id);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
            return;
        }
        const isOwner = user && String(note.userId) === String(user._id);
        if (!isOwner && note.visibility !== 'public') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        res.json(note);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getNoteById = getNoteById;
const updateNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const note = yield note_1.default.findById(id);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
            return;
        }
        if (String(note.userId) !== String(user._id)) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const updatable = ['title', 'liked', 'notes', 'category', 'tags', 'photos', 'place', 'product', 'visibility', 'remindAt'];
        const update = {};
        for (const key of updatable) {
            if (key in req.body)
                update[key] = req.body[key];
        }
        const updated = yield note_1.default.findByIdAndUpdate(id, update, { new: true });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateNote = updateNote;
const deleteNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const note = yield note_1.default.findById(id);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
            return;
        }
        if (String(note.userId) !== String(user._id)) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        yield note_1.default.deleteOne({ _id: id });
        yield note_like_1.default.deleteMany({ itemId: id });
        yield note_comment_1.default.deleteMany({ itemId: id });
        res.json({ message: 'Note deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteNote = deleteNote;
const likeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const note = yield note_1.default.findById(id);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
            return;
        }
        try {
            yield note_like_1.default.create({ itemId: id, userId: user._id });
            yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.likes': 1 } });
            res.json({ message: 'Liked' });
        }
        catch (err) {
            if (err && err.code === 11000) {
                res.status(200).json({ message: 'Already liked' });
                return;
            }
            throw err;
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.likeNote = likeNote;
const unlikeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const removed = yield note_like_1.default.deleteOne({ itemId: id, userId: user._id });
        if (removed.deletedCount) {
            yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.likes': -1 } });
        }
        res.json({ message: removed.deletedCount ? 'Unliked' : 'Not liked' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.unlikeNote = unlikeNote;
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const { text } = req.body;
        if (!text || typeof text !== 'string' || text.trim() === '') {
            res.status(400).json({ message: 'text is required' });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const note = yield note_1.default.findById(id);
        if (!note) {
            res.status(404).json({ message: 'Note not found' });
            return;
        }
        const comment = yield note_comment_1.default.create({ itemId: id, userId: user._id, text });
        yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.comments': 1 } });
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.addComment = addComment;
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const comments = yield note_comment_1.default.find({ itemId: id }).sort({ createdAt: -1 });
        res.json(comments);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getComments = getComments;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id, commentId } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id) || !mongoose_1.Types.ObjectId.isValid(commentId)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const comment = yield note_comment_1.default.findById(commentId);
        if (!comment) {
            res.status(404).json({ message: 'Comment not found' });
            return;
        }
        if (String(comment.userId) !== String(user._id)) {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        yield note_comment_1.default.deleteOne({ _id: commentId });
        yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.comments': -1 } });
        res.json({ message: 'Comment deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteComment = deleteComment;
//# sourceMappingURL=notes.js.map