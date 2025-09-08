import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Note from '../models/note';
import { CategoryNoteModel } from '../models/note-category';
import { CategoryNoteProposalModel } from '../models/note-category-proposa';
import NoteLike from '../models/note-like';
import NoteComment from '../models/note-comment';

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const {
      title,
      liked,
      notes,
      categoryId,
      pendingCategoryId,
      tags,
      photos,
      place,
      product,
      visibility,
      remindAt,
    } = req.body as {
      title: string; liked: boolean; notes?: string; categoryId?: string; pendingCategoryId?: string; tags?: string[]; photos?: string[]; place?: any; product?: any; visibility: 'private'|'public'; remindAt?: number;
    };

    if (!title || typeof liked !== 'boolean' || !visibility) {
      res.status(400).json({ message: 'title, liked and visibility are required' });
      return;
    }

    // Validaciones de categoría
    if (categoryId && pendingCategoryId) {
      res.status(400).json({ message: 'Provide only one of categoryId or pendingCategoryId' });
      return;
    }

    const doc: any = {
      userId: user._id,
      title,
      liked,
      notes,
      tags,
      photos,
      place,
      product,
      visibility,
      remindAt,
    };

    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId)) {
        res.status(400).json({ message: 'Invalid categoryId' });
        return;
      }
      const categoryExists = await CategoryNoteModel.findById(categoryId);
      if (!categoryExists) {
        res.status(400).json({ message: 'categoryId not found' });
        return;
      }
      doc.categoryId = categoryId;
    } else if (pendingCategoryId) {
      if (!Types.ObjectId.isValid(pendingCategoryId)) {
        res.status(400).json({ message: 'Invalid pendingCategoryId' });
        return;
      }
      const proposal = await CategoryNoteProposalModel.findOne({ _id: pendingCategoryId, status: 'pending' });
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

    const newNote = await Note.create(doc);
    const populatedNote = await Note.findById(newNote._id)
      .populate('userId', 'name img')
      .populate('categoryId', 'name emoji color');

    res.status(201).json(populatedNote);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const notes = await Note.find({ userId: user._id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    // Usar params si están disponibles, sino valores por defecto
    const { desde = 0, limit = 10 } = req.params;
    const query = { visibility: 'public' };
    
    console.log('Route params:', { desde, limit });
    console.log('req.params:', req.params);

    const [total, notes] = await Promise.all([
      Note.countDocuments(query),
      Note.find(query)
        .sort({ updatedAt: -1 })
        .populate('userId', 'name img')
        .populate('categoryId', 'name emoji color')
        .skip(Number(desde))
        .limit(Number(limit))
    ]);

    res.status(200).json({ total, notes });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const note = await Note.findById(id)
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    if (String(note.userId) !== String(user._id)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const updatable = ['title', 'liked', 'notes', 'tags', 'photos', 'place', 'product', 'visibility', 'remindAt'] as const;
    const update: any = {};
    for (const key of updatable) {
      if (key in req.body) update[key] = (req.body as any)[key];
    }

    const { categoryId, pendingCategoryId } = req.body as { categoryId?: string; pendingCategoryId?: string };
    if (categoryId !== undefined && pendingCategoryId !== undefined) {
      res.status(400).json({ message: 'Provide only one of categoryId or pendingCategoryId' });
      return;
    }
    if (categoryId !== undefined) {
      if (categoryId === null || categoryId === '') {
        update.$unset = { ...(update.$unset || {}), categoryId: '' };
      } else {
        if (!Types.ObjectId.isValid(categoryId)) {
          res.status(400).json({ message: 'Invalid categoryId' });
          return;
        }
        const categoryExists = await CategoryNoteModel.findById(categoryId);
        if (!categoryExists) {
          res.status(400).json({ message: 'categoryId not found' });
          return;
        }
        update.categoryId = categoryId;
        if (update.$unset) delete update.$unset.pendingCategoryId;
      }
    }
    if (pendingCategoryId !== undefined) {
      if (pendingCategoryId === null || pendingCategoryId === '') {
        update.$unset = { ...(update.$unset || {}), pendingCategoryId: '' };
      } else {
        if (!Types.ObjectId.isValid(pendingCategoryId)) {
          res.status(400).json({ message: 'Invalid pendingCategoryId' });
          return;
        }
        const proposal = await CategoryNoteProposalModel.findOne({ _id: pendingCategoryId, status: 'pending' });
        if (!proposal) {
          res.status(400).json({ message: 'pendingCategoryId not found or not pending' });
          return;
        }
        if (String(proposal.createdBy) !== String(user._id)) {
          res.status(403).json({ message: 'You can only use your own pending category' });
          return;
        }
        update.pendingCategoryId = pendingCategoryId;
        if (update.$unset) delete update.$unset.categoryId;
      }
    }

    const updated = await Note.findByIdAndUpdate(id, update, { new: true })
      .populate('userId', 'name img')
      .populate('categoryId', 'name emoji color');
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    if (String(note.userId) !== String(user._id)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    await Note.deleteOne({ _id: id });
    await NoteLike.deleteMany({ itemId: id });
    await NoteComment.deleteMany({ itemId: id });
    res.json({ message: 'Note deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const likeNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    try {
      await NoteLike.create({ itemId: id as any, userId: user._id });
      await Note.updateOne({ _id: id }, { $inc: { 'publicStats.likes': 1 } });
      res.json({ message: 'Liked' });
    } catch (err: any) {
      if (err && err.code === 11000) {
        res.status(200).json({ message: 'Already liked' });
        return;
      }
      throw err;
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const unlikeNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const removed = await NoteLike.deleteOne({ itemId: id, userId: user._id });
    if (removed.deletedCount) {
      await Note.updateOne({ _id: id }, { $inc: { 'publicStats.likes': -1 } });
    }
    res.json({ message: removed.deletedCount ? 'Unliked' : 'Not liked' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
      res.status(400).json({ message: 'text is required' });
      return;
    }
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const note = await Note.findById(id);
    if (!note) {
      res.status(404).json({ message: 'Note not found' });
      return;
    }
    const comment = await NoteComment.create({ itemId: id as any, userId: user._id, text });
    await Note.updateOne({ _id: id }, { $inc: { 'publicStats.comments': 1 } });
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const comments = await NoteComment.find({ itemId: id }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const { id, commentId } = req.params;
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const comment = await NoteComment.findById(commentId);
    if (!comment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }
    if (String(comment.userId) !== String(user._id)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    await NoteComment.deleteOne({ _id: commentId });
    await Note.updateOne({ _id: id }, { $inc: { 'publicStats.comments': -1 } });
    res.json({ message: 'Comment deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


