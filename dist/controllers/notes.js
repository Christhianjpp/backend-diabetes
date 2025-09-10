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
exports.deleteComment = exports.getComments = exports.addComment = exports.getAgreements = exports.unagreeNote = exports.agreeNote = exports.unlikeNote = exports.likeNote = exports.deleteNote = exports.updateNote = exports.getNoteById = exports.getPublicNotes = exports.getMyNotes = exports.createNote = void 0;
const mongoose_1 = require("mongoose");
const note_1 = __importDefault(require("../models/note"));
const note_category_1 = require("../models/note-category");
const note_category_proposa_1 = require("../models/note-category-proposa");
const note_like_1 = __importDefault(require("../models/note-like"));
const note_comment_1 = __importDefault(require("../models/note-comment"));
const note_agreement_1 = __importDefault(require("../models/note-agreement"));
const note_aggregations_1 = require("../helpers/note-aggregations");
const note_response_mapper_1 = require("../helpers/note-response-mapper");
const createNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { title, isImportant = false, // Renombrado de 'liked'
        notes, categoryId, pendingCategoryId, tags, photos, place, product, visibility, remindAt, } = req.body;
        if (!title || !visibility) {
            res.status(400).json({ message: 'title and visibility are required' });
            return;
        }
        // Validaciones de categoría
        if (categoryId && pendingCategoryId) {
            res.status(400).json({ message: 'Provide only one of categoryId or pendingCategoryId' });
            return;
        }
        const doc = {
            userId: user._id,
            title,
            isImportant,
            notes,
            tags,
            photos,
            place,
            product,
            visibility,
            remindAt,
        };
        if (categoryId) {
            if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
                res.status(400).json({ message: 'Invalid categoryId' });
                return;
            }
            const categoryExists = yield note_category_1.CategoryNoteModel.findById(categoryId);
            if (!categoryExists) {
                res.status(400).json({ message: 'categoryId not found' });
                return;
            }
            doc.categoryId = categoryId;
        }
        else if (pendingCategoryId) {
            if (!mongoose_1.Types.ObjectId.isValid(pendingCategoryId)) {
                res.status(400).json({ message: 'Invalid pendingCategoryId' });
                return;
            }
            const proposal = yield note_category_proposa_1.CategoryNoteProposalModel.findOne({ _id: pendingCategoryId, status: 'pending' });
            if (!proposal) {
                res.status(400).json({ message: 'pendingCategoryId not found or not pending' });
                return;
            }
            if (String(proposal.createdBy) !== String(user._id)) {
                res.status(403).json({ message: 'You can only use your own pending category' });
                return;
            }
            doc.pendingCategoryId = pendingCategoryId;
        }
        const newNote = yield note_1.default.create(doc);
        const populatedNote = yield note_1.default.findById(newNote._id)
            .populate('userId', 'name img')
            .populate('categoryId', 'name emoji color');
        res.status(201).json(populatedNote);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createNote = createNote;
const getMyNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        // Usar agregación para obtener notas con estado de like
        const notes = yield note_1.default.aggregate((0, note_aggregations_1.getMyNotesWithLikesPipeline)(user._id.toString()));
        // Mapear resultados de agregación al formato de respuesta
        const mappedNotes = (0, note_response_mapper_1.mapAggregationResultsToResponse)(notes);
        res.json(mappedNotes);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getMyNotes = getMyNotes;
const getPublicNotes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        const { desde = 0, limit = 10 } = req.params;
        if (!user || !user._id) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Usar agregación para obtener notas con estado de like del usuario actual
        const [totalResult, notes] = yield Promise.all([
            note_1.default.aggregate((0, note_aggregations_1.countPublicNotesPipeline)()),
            note_1.default.aggregate((0, note_aggregations_1.getPublicNotesWithLikesPipeline)(user._id.toString(), Number(desde), Number(limit)))
        ]);
        const total = ((_a = totalResult[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
        // Mapear resultados de agregación al formato de respuesta
        const mappedNotes = (0, note_response_mapper_1.mapAggregationResultsToResponse)(notes);
        console.log('📤 Sending response with notes count:', mappedNotes.length);
        res.status(200).json({ total, notes: mappedNotes });
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
        const note = yield note_1.default.findById(id)
            .populate('userId', 'name img')
            .populate('categoryId', 'name emoji color');
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
        const updatable = ['title', 'liked', 'notes', 'tags', 'photos', 'place', 'product', 'visibility', 'remindAt'];
        const update = {};
        for (const key of updatable) {
            if (key in req.body)
                update[key] = req.body[key];
        }
        const { categoryId, pendingCategoryId } = req.body;
        if (categoryId !== undefined && pendingCategoryId !== undefined) {
            res.status(400).json({ message: 'Provide only one of categoryId or pendingCategoryId' });
            return;
        }
        if (categoryId !== undefined) {
            if (categoryId === null || categoryId === '') {
                update.$unset = Object.assign(Object.assign({}, (update.$unset || {})), { categoryId: '' });
            }
            else {
                if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
                    res.status(400).json({ message: 'Invalid categoryId' });
                    return;
                }
                const categoryExists = yield note_category_1.CategoryNoteModel.findById(categoryId);
                if (!categoryExists) {
                    res.status(400).json({ message: 'categoryId not found' });
                    return;
                }
                update.categoryId = categoryId;
                if (update.$unset)
                    delete update.$unset.pendingCategoryId;
            }
        }
        if (pendingCategoryId !== undefined) {
            if (pendingCategoryId === null || pendingCategoryId === '') {
                update.$unset = Object.assign(Object.assign({}, (update.$unset || {})), { pendingCategoryId: '' });
            }
            else {
                if (!mongoose_1.Types.ObjectId.isValid(pendingCategoryId)) {
                    res.status(400).json({ message: 'Invalid pendingCategoryId' });
                    return;
                }
                const proposal = yield note_category_proposa_1.CategoryNoteProposalModel.findOne({ _id: pendingCategoryId, status: 'pending' });
                if (!proposal) {
                    res.status(400).json({ message: 'pendingCategoryId not found or not pending' });
                    return;
                }
                if (String(proposal.createdBy) !== String(user._id)) {
                    res.status(403).json({ message: 'You can only use your own pending category' });
                    return;
                }
                update.pendingCategoryId = pendingCategoryId;
                if (update.$unset)
                    delete update.$unset.categoryId;
            }
        }
        const updated = yield note_1.default.findByIdAndUpdate(id, update, { new: true })
            .populate('userId', 'name img')
            .populate('categoryId', 'name emoji color');
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
        yield note_like_1.default.deleteMany({ noteId: id });
        yield note_comment_1.default.deleteMany({ itemId: id });
        res.json({ message: 'Note deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteNote = deleteNote;
const likeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    try {
        const user = req.user;
        const { id } = req.params;
        console.log('❤️  likeNote called:', {
            noteId: id,
            userId: user._id.toString(),
            userType: typeof user._id
        });
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            // Verificar que la nota existe
            const note = yield note_1.default.findById(id).session(session);
            if (!note) {
                throw new Error('Note not found');
            }
            // Verificar si ya tiene like (para evitar duplicados)
            const existingLike = yield note_like_1.default.findOne({
                noteId: id,
                userId: user._id
            }).session(session);
            if (existingLike) {
                throw new Error('Already liked');
            }
            // Crear like y actualizar contador atómicamente
            console.log('✅ Creating like and updating counter...');
            yield note_like_1.default.create([{ noteId: id, userId: user._id }], { session });
            const updateResult = yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.likes': 1 } }, { session });
            console.log('📊 Counter update result:', updateResult);
        }));
        res.json({ message: 'Liked' });
    }
    catch (error) {
        if (error.message === 'Note not found') {
            res.status(404).json({ message: 'Note not found' });
        }
        else if (error.message === 'Already liked') {
            res.status(200).json({ message: 'Already liked' });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
    finally {
        yield session.endSession();
    }
});
exports.likeNote = likeNote;
const unlikeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        let wasRemoved = false;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            // Verificar que la nota existe
            const note = yield note_1.default.findById(id).session(session);
            if (!note) {
                throw new Error('Note not found');
            }
            // Eliminar like si existe
            const removed = yield note_like_1.default.deleteOne({
                noteId: id,
                userId: user._id
            }).session(session);
            wasRemoved = removed.deletedCount > 0;
            if (wasRemoved) {
                // Decrementar contador solo si se eliminó un like
                yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.likes': -1 } }, { session });
            }
        }));
        res.json({ message: wasRemoved ? 'Unliked' : 'Not liked' });
    }
    catch (error) {
        if (error.message === 'Note not found') {
            res.status(404).json({ message: 'Note not found' });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
    finally {
        yield session.endSession();
    }
});
exports.unlikeNote = unlikeNote;
const agreeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const note = yield note_1.default.findById(id).session(session);
            if (!note)
                throw new Error('Note not found');
            const existing = yield note_agreement_1.default.findOne({ noteId: id, userId: user._id }).session(session);
            if (existing)
                throw new Error('Already agreed');
            yield note_agreement_1.default.create([{ noteId: id, userId: user._id }], { session });
            yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.agreements': 1 } }, { session });
        }));
        res.json({ message: 'Agreed' });
    }
    catch (error) {
        if (error.message === 'Note not found') {
            res.status(404).json({ message: 'Note not found' });
        }
        else if (error.message === 'Already agreed') {
            res.status(200).json({ message: 'Already agreed' });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
    finally {
        yield session.endSession();
    }
});
exports.agreeNote = agreeNote;
const unagreeNote = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    try {
        const user = req.user;
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        let wasRemoved = false;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const note = yield note_1.default.findById(id).session(session);
            if (!note)
                throw new Error('Note not found');
            const removed = yield note_agreement_1.default.deleteOne({ noteId: id, userId: user._id }).session(session);
            wasRemoved = removed.deletedCount > 0;
            if (wasRemoved) {
                yield note_1.default.updateOne({ _id: id }, { $inc: { 'publicStats.agreements': -1 } }, { session });
            }
        }));
        res.json({ message: wasRemoved ? 'Unagreed' : 'Not agreed' });
    }
    catch (error) {
        if (error.message === 'Note not found') {
            res.status(404).json({ message: 'Note not found' });
        }
        else {
            res.status(500).json({ message: error.message });
        }
    }
    finally {
        yield session.endSession();
    }
});
exports.unagreeNote = unagreeNote;
const getAgreements = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid id' });
            return;
        }
        const agreements = yield note_agreement_1.default.find({ noteId: id })
            .sort({ createdAt: -1 })
            .populate('userId', 'name img');
        res.json(agreements.map((a) => a.toJSON()));
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAgreements = getAgreements;
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