import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { CategoryNoteModel } from '../models/note-category';
import { CategoryNoteAliasModel } from '../models/note-category-alias';
import { CategoryNoteProposalModel } from '../models/note-category-proposa';
import { proposeCategory } from '../services/categories';

export const proposeCategoryController = async (req: Request, res: Response): Promise<void> => {
  console.log('proposeCategoryController');
  console.log('proposeCategoryController', req.body);
  try {
    const user = req.user as any;
    const { name } = req.body as { name?: string };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ message: 'name is required (min 2 chars)' });
      return;
    }
    const result = await proposeCategory(name.trim(), new Types.ObjectId(user._id));

    // Si retorna Category -> auto-aprobada; si retorna Proposal -> pendiente/merged
    if ('_id' in result && 'name' in result) {
      res.status(201).json({ status: 'approved', categoryId: (result as any)._id, category: result });
      return;
    }
    res.status(201).json({ status: (result as any).status, proposalId: (result as any)._id, proposal: result });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const searchCategoriesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    const query = (q || '').trim();
    if (!query) {
      const top = await CategoryNoteModel.find().sort({ updatedAt: -1 }).limit(10);
      res.json({ categories: top, aliases: [] });
      return;
    }
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const categories = await CategoryNoteModel.find({ $or: [{ name: regex }, { normalized: regex }] }).limit(10);
    const aliases = await CategoryNoteAliasModel.find({ alias: regex }).limit(10);
    res.json({ categories, aliases });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCategoriesController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await CategoryNoteModel.find().sort({ name: 1 });
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingProposalsController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const items = await CategoryNoteProposalModel.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(50);
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};



