import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT, validateFields } from '../middlewares';
import {
  createNote,
  getMyNotes,
  getPublicNotes,
  getNoteById,
  updateNote,
  deleteNote,
  likeNote,
  unlikeNote,
  agreeNote,
  unagreeNote,
  getAgreements,
  addComment,
  getComments,
  deleteComment,
} from '../controllers/notes';

const router = Router();

router.get('/public/:desde/:limit', [validateJWT], getPublicNotes);
router.get('/public', [validateJWT], getPublicNotes); // Fallback sin parámetros

router.get('/', [validateJWT], getMyNotes);

router.post(
  '/',
  [
    validateJWT,
    check('title', 'title is required').not().isEmpty(),
    check('isImportant', 'isImportant must be boolean').optional().isBoolean(),
    check('visibility', 'visibility must be private|public').isIn(['private', 'public']),
    validateFields,
  ],
  createNote
);

router.get('/:id', getNoteById);

router.put('/:id', [validateJWT], updateNote);

router.delete('/:id', [validateJWT], deleteNote);

router.post('/:id/like', [validateJWT], likeNote);
router.delete('/:id/like', [validateJWT], unlikeNote);

// Agreements
router.post('/:id/agree', [validateJWT], agreeNote);
router.delete('/:id/agree', [validateJWT], unagreeNote);
router.get('/:id/agreements', getAgreements);

router.get('/:id/comments', [validateJWT], getComments);
router.post(
  '/:id/comments',
  [validateJWT, check('text', 'text is required').not().isEmpty(), validateFields],
  addComment
);
router.delete('/:id/comments/:commentId', [validateJWT], deleteComment);

export default router;


