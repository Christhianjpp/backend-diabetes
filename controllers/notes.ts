import { Request, Response } from 'express';
import { Types, startSession } from 'mongoose';
import Note from '../models/note';
import { CategoryNoteModel } from '../models/note-category';
import { CategoryNoteProposalModel } from '../models/note-category-proposa';
import NoteLike from '../models/note-like';
import NoteComment from '../models/note-comment';
import NoteAgreement from '../models/note-agreement';
import { 
  getPublicNotesWithLikesPipeline, 
  getMyNotesWithLikesPipeline,
  countPublicNotesPipeline 
} from '../helpers/note-aggregations';
import { mapAggregationResultsToResponse } from '../helpers/note-response-mapper';

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as any;
    const {
      title,
      isImportant = false,  // Renombrado de 'liked'
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
      title: string; isImportant?: boolean; notes?: string; categoryId?: string; pendingCategoryId?: string; tags?: string[]; photos?: string[]; place?: any; product?: any; visibility: 'private'|'public'; remindAt?: number;
    };

    if (!title || !visibility) {
      res.status(400).json({ message: 'title and visibility are required' });
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
    
    // Usar agregación para obtener notas con estado de like
    const notes = await Note.aggregate(getMyNotesWithLikesPipeline(user._id.toString()));
    
    // Mapear resultados de agregación al formato de respuesta
    const mappedNotes = mapAggregationResultsToResponse(notes);
    
    res.json(mappedNotes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicNotes = async (req: Request, res: Response): Promise<void> => {

  try {
    const user = req.user as any;
    const { desde = 0, limit = 10 } = req.params;

    if (!user || !user._id) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Usar agregación para obtener notas con estado de like del usuario actual
    const [totalResult, notes] = await Promise.all([
      Note.aggregate(countPublicNotesPipeline()),
      Note.aggregate(getPublicNotesWithLikesPipeline(
        user._id.toString(), 
        Number(desde), 
        Number(limit)
      ))
    ]);

    const total = totalResult[0]?.total || 0;
    
    // Mapear resultados de agregación al formato de respuesta
    const mappedNotes = mapAggregationResultsToResponse(notes);
    
    console.log('📤 Sending response with notes count:', mappedNotes.length);
    
    res.status(200).json({ total, notes: mappedNotes });
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
    await NoteLike.deleteMany({ noteId: id });
    await NoteComment.deleteMany({ itemId: id });
    res.json({ message: 'Note deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const likeNote = async (req: Request, res: Response): Promise<void> => {
  const session = await startSession();
  
  try {
    const user = req.user as any;
    const { id } = req.params;
    
    console.log('❤️  likeNote called:', {
      noteId: id,
      userId: user._id.toString(),
      userType: typeof user._id
    });
    
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }

    await session.withTransaction(async () => {
      // Verificar que la nota existe
      const note = await Note.findById(id).session(session);
      if (!note) {
        throw new Error('Note not found');
      }

      // Verificar si ya tiene like (para evitar duplicados)
      const existingLike = await NoteLike.findOne({ 
        noteId: id, 
        userId: user._id 
      }).session(session);
      
      if (existingLike) {
        throw new Error('Already liked');
      }

      // Crear like y actualizar contador atómicamente
      console.log('✅ Creating like and updating counter...');
      await NoteLike.create([{ noteId: id, userId: user._id }], { session });
      const updateResult = await Note.updateOne(
        { _id: id }, 
        { $inc: { 'publicStats.likes': 1 } },
        { session }
      );
      console.log('📊 Counter update result:', updateResult);
    });

    res.json({ message: 'Liked' });
  } catch (error: any) {
    if (error.message === 'Note not found') {
      res.status(404).json({ message: 'Note not found' });
    } else if (error.message === 'Already liked') {
      res.status(200).json({ message: 'Already liked' });
    } else {
      res.status(500).json({ message: error.message });
    }
  } finally {
    await session.endSession();
  }
};

export const unlikeNote = async (req: Request, res: Response): Promise<void> => {
  const session = await startSession();
  
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }

    let wasRemoved = false;

    await session.withTransaction(async () => {
      // Verificar que la nota existe
      const note = await Note.findById(id).session(session);
      if (!note) {
        throw new Error('Note not found');
      }

      // Eliminar like si existe
      const removed = await NoteLike.deleteOne({ 
        noteId: id, 
        userId: user._id 
      }).session(session);
      
      wasRemoved = removed.deletedCount > 0;
      
      if (wasRemoved) {
        // Decrementar contador solo si se eliminó un like
        await Note.updateOne(
          { _id: id }, 
          { $inc: { 'publicStats.likes': -1 } },
          { session }
        );
      }
    });

    res.json({ message: wasRemoved ? 'Unliked' : 'Not liked' });
  } catch (error: any) {
    if (error.message === 'Note not found') {
      res.status(404).json({ message: 'Note not found' });
    } else {
      res.status(500).json({ message: error.message });
    }
  } finally {
    await session.endSession();
  }
};

export const agreeNote = async (req: Request, res: Response): Promise<void> => {
  const session = await startSession();
  try {
    const user = req.user as any;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    await session.withTransaction(async () => {
      const note = await Note.findById(id).session(session);
      if (!note) throw new Error('Note not found');
      const existing = await NoteAgreement.findOne({ noteId: id, userId: user._id }).session(session);
      if (existing) throw new Error('Already agreed');
      await NoteAgreement.create([{ noteId: id, userId: user._id }], { session });
      await Note.updateOne({ _id: id }, { $inc: { 'publicStats.agreements': 1 } }, { session });
    });
    res.json({ message: 'Agreed' });
  } catch (error: any) {
    if (error.message === 'Note not found') {
      res.status(404).json({ message: 'Note not found' });
    } else if (error.message === 'Already agreed') {
      res.status(200).json({ message: 'Already agreed' });
    } else {
      res.status(500).json({ message: error.message });
    }
  } finally {
    await session.endSession();
  }
};

export const unagreeNote = async (req: Request, res: Response): Promise<void> => {
  const session = await startSession();
  try {
    const user = (req as any).user;
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    let wasRemoved = false;
    await session.withTransaction(async () => {
      const note = await Note.findById(id).session(session);
      if (!note) throw new Error('Note not found');
      const removed = await NoteAgreement.deleteOne({ noteId: id, userId: user._id }).session(session);
      wasRemoved = removed.deletedCount > 0;
      if (wasRemoved) {
        await Note.updateOne({ _id: id }, { $inc: { 'publicStats.agreements': -1 } }, { session });
      }
    });
    res.json({ message: wasRemoved ? 'Unagreed' : 'Not agreed' });
  } catch (error: any) {
    if (error.message === 'Note not found') {
      res.status(404).json({ message: 'Note not found' });
    } else {
      res.status(500).json({ message: error.message });
    }
  } finally {
    await session.endSession();
  }
};

export const getAgreements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ message: 'Invalid id' });
      return;
    }
    const agreements = await NoteAgreement.find({ noteId: id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name img');
    res.json(agreements.map((a: any) => a.toJSON()));
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


