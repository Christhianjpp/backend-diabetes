import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT, validateFields, isAdminRole } from '../middlewares';
import { getAllCategoriesController, getPendingProposalsController, proposeCategoryController, searchCategoriesController, approveProposalController, mergeProposalController, rejectProposalController, getMyPendingProposalsController } from '../controllers/categories';

const router = Router();

router.get('/search', searchCategoriesController);
router.get('/', getAllCategoriesController);
router.get('/proposals/pending', [validateJWT, isAdminRole], getPendingProposalsController);
router.post('/propose', [validateJWT, check('name', 'name is required').not().isEmpty(), validateFields], proposeCategoryController);
router.post('/proposals/:id/approve', [validateJWT, isAdminRole], approveProposalController);
router.post('/proposals/:id/merge', [validateJWT, isAdminRole, check('targetCategoryId', 'targetCategoryId is required').not().isEmpty(), validateFields], mergeProposalController);
router.post('/proposals/:id/reject', [validateJWT, isAdminRole], rejectProposalController);
router.get('/proposals/mine/pending', [validateJWT], getMyPendingProposalsController);

export default router;



