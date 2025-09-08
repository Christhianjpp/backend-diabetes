"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const middlewares_1 = require("../middlewares");
const categories_1 = require("../controllers/categories");
const router = (0, express_1.Router)();
router.get('/search', categories_1.searchCategoriesController);
router.get('/', categories_1.getAllCategoriesController);
router.get('/proposals/pending', [middlewares_1.validateJWT, middlewares_1.isAdminRole], categories_1.getPendingProposalsController);
router.post('/propose', [middlewares_1.validateJWT, (0, express_validator_1.check)('name', 'name is required').not().isEmpty(), middlewares_1.validateFields], categories_1.proposeCategoryController);
router.post('/proposals/:id/approve', [middlewares_1.validateJWT, middlewares_1.isAdminRole], categories_1.approveProposalController);
router.post('/proposals/:id/merge', [middlewares_1.validateJWT, middlewares_1.isAdminRole, (0, express_validator_1.check)('targetCategoryId', 'targetCategoryId is required').not().isEmpty(), middlewares_1.validateFields], categories_1.mergeProposalController);
router.post('/proposals/:id/reject', [middlewares_1.validateJWT, middlewares_1.isAdminRole], categories_1.rejectProposalController);
router.get('/proposals/mine/pending', [middlewares_1.validateJWT], categories_1.getMyPendingProposalsController);
exports.default = router;
//# sourceMappingURL=categories.js.map