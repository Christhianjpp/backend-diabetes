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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingProposalsController = exports.getAllCategoriesController = exports.searchCategoriesController = exports.proposeCategoryController = void 0;
const mongoose_1 = require("mongoose");
const note_category_1 = require("../models/note-category");
const note_category_alias_1 = require("../models/note-category-alias");
const note_category_proposa_1 = require("../models/note-category-proposa");
const categories_1 = require("../services/categories");
const proposeCategoryController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('proposeCategoryController');
    console.log('proposeCategoryController', req.body);
    try {
        const user = req.user;
        const { name } = req.body;
        if (!name || name.trim().length < 2) {
            res.status(400).json({ message: 'name is required (min 2 chars)' });
            return;
        }
        const result = yield (0, categories_1.proposeCategory)(name.trim(), new mongoose_1.Types.ObjectId(user._id));
        // Si retorna Category -> auto-aprobada; si retorna Proposal -> pendiente/merged
        if ('_id' in result && 'name' in result) {
            res.status(201).json({ status: 'approved', categoryId: result._id, category: result });
            return;
        }
        res.status(201).json({ status: result.status, proposalId: result._id, proposal: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.proposeCategoryController = proposeCategoryController;
const searchCategoriesController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { q } = req.query;
        const query = (q || '').trim();
        if (!query) {
            const top = yield note_category_1.CategoryNoteModel.find().sort({ updatedAt: -1 }).limit(10);
            res.json({ categories: top, aliases: [] });
            return;
        }
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const categories = yield note_category_1.CategoryNoteModel.find({ $or: [{ name: regex }, { normalized: regex }] }).limit(10);
        const aliases = yield note_category_alias_1.CategoryNoteAliasModel.find({ alias: regex }).limit(10);
        res.json({ categories, aliases });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.searchCategoriesController = searchCategoriesController;
const getAllCategoriesController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield note_category_1.CategoryNoteModel.find().sort({ name: 1 });
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAllCategoriesController = getAllCategoriesController;
const getPendingProposalsController = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield note_category_proposa_1.CategoryNoteProposalModel.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(50);
        res.json(items);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPendingProposalsController = getPendingProposalsController;
//# sourceMappingURL=categories.js.map