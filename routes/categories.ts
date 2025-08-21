import { Router } from 'express';
import { check } from 'express-validator';
import { validateJWT, validateFields } from '../middlewares';
import { getAllCategoriesController, getPendingProposalsController, proposeCategoryController, searchCategoriesController } from '../controllers/categories';

const router = Router();

router.get('/search', searchCategoriesController);
router.get('/', getAllCategoriesController);
router.get('/proposals/pending', [validateJWT], getPendingProposalsController);
router.post('/propose', [validateJWT, check('name', 'name is required').not().isEmpty(), validateFields], proposeCategoryController);

export default router;



