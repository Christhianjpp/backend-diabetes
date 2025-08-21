import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Note from '../models/note';
import NoteLike from '../models/note-like';
import NoteComment from '../models/note-comment';

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const {
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
    } = req.body;

    if (!title || typeof liked !== 'boolean' || !visibility) {
      res.status(400).json({ message: 'title, liked and visibility are required' });
      return;
    }

    const newNote = await Note.create({
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

export const getPublicNotes = async (_req: Request, res: Response): Promise<void> => {
  try {
    const notes = await Note.find({ visibility: 'public' }).sort({ updatedAt: -1 });
    res.json(notes);
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
    const note = await Note.findById(id);
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
    const updatable = ['title', 'liked', 'notes', 'category', 'tags', 'photos', 'place', 'product', 'visibility', 'remindAt'] as const;
    const update: any = {};
    for (const key of updatable) {
      if (key in req.body) update[key] = (req.body as any)[key];
    }
    const updated = await Note.findByIdAndUpdate(id, update, { new: true });
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


