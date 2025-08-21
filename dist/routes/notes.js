"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const middlewares_1 = require("../middlewares");
const notes_1 = require("../controllers/notes");
const router = (0, express_1.Router)();
router.get('/public', notes_1.getPublicNotes);
router.get('/', [middlewares_1.validateJWT], notes_1.getMyNotes);
router.post('/', [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)('title', 'title is required').not().isEmpty(),
    (0, express_validator_1.check)('liked', 'liked must be boolean').isBoolean(),
    (0, express_validator_1.check)('visibility', 'visibility must be private|public').isIn(['private', 'public']),
    middlewares_1.validateFields,
], notes_1.createNote);
router.get('/:id', notes_1.getNoteById);
router.put('/:id', [middlewares_1.validateJWT], notes_1.updateNote);
router.delete('/:id', [middlewares_1.validateJWT], notes_1.deleteNote);
router.post('/:id/like', [middlewares_1.validateJWT], notes_1.likeNote);
router.delete('/:id/like', [middlewares_1.validateJWT], notes_1.unlikeNote);
router.get('/:id/comments', notes_1.getComments);
router.post('/:id/comments', [middlewares_1.validateJWT, (0, express_validator_1.check)('text', 'text is required').not().isEmpty(), middlewares_1.validateFields], notes_1.addComment);
router.delete('/:id/comments/:commentId', [middlewares_1.validateJWT], notes_1.deleteComment);
exports.default = router;
//# sourceMappingURL=notes.js.map