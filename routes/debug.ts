import { Router, Request, Response } from 'express';
import { validateJWT } from '../middlewares';
import mongoose from 'mongoose';

const router = Router();

// Ruta para migrar NoteLikes de itemId a noteId
router.post('/migrate-notelikes', [validateJWT], async (req: Request, res: Response) => {
  try {
    console.log('🔄 Starting NoteLikes migration...');
    
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    const db = mongoose.connection.db;
    const coll = db.collection('notelikes');

    // 1) Mostrar índices actuales
    const indexes = await coll.indexes();
    console.log('🧭 Current indexes:', indexes);

    // 2) Eliminar índice legacy si existe (itemId_1_userId_1)
    const legacyIndex = indexes.find((i: any) => i.name === 'itemId_1_userId_1');
    if (legacyIndex) {
      console.log('🧹 Dropping legacy index itemId_1_userId_1...');
      await coll.dropIndex('itemId_1_userId_1');
    }

    // 3) Limpiar documentos inválidos (itemId null o ausente)
    const invalidResult = await coll.deleteMany({ $or: [ { itemId: null }, { itemId: { $exists: false } } ] });
    console.log(`🗑️ Removed invalid docs (itemId null/missing): ${invalidResult.deletedCount}`);

    // 4) Deduplicar por (itemId, userId) antes de renombrar
    const duplicateGroups = await coll.aggregate([
      { $match: { itemId: { $exists: true, $ne: null } } },
      { $group: { _id: { itemId: '$itemId', userId: '$userId' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    let removedDuplicates = 0;
    for (const grp of duplicateGroups) {
      // Mantener el primer id y eliminar el resto
      const [, ...toRemove] = grp.ids;
      if (toRemove.length > 0) {
        const delRes = await coll.deleteMany({ _id: { $in: toRemove } });
        removedDuplicates += delRes.deletedCount || 0;
      }
    }
    console.log(`🧽 Removed duplicate docs by (itemId,userId): ${removedDuplicates}`);

    // 5) Renombrar itemId -> noteId para todos los restantes
    const renameResult = await coll.updateMany(
      { itemId: { $exists: true } },
      { $rename: { itemId: 'noteId' } }
    );
    console.log(`✅ Renamed itemId->noteId in ${renameResult.modifiedCount} documents`);

    // 6) Crear índice único nuevo en (noteId,userId) si no existe
    const newIndexes = await coll.indexes();
    const hasNewIndex = newIndexes.find((i: any) => i.name === 'noteId_1_userId_1');
    if (!hasNewIndex) {
      console.log('🧩 Creating unique index noteId_1_userId_1...');
      await coll.createIndex({ noteId: 1, userId: 1 }, { unique: true, name: 'noteId_1_userId_1' });
    }

    // 7) Reporte final
    const totalWithNoteId = await coll.countDocuments({ noteId: { $exists: true } });
    res.json({
      message: 'Migration completed',
      removedInvalid: invalidResult.deletedCount,
      removedDuplicates,
      renamed: renameResult.modifiedCount,
      totalWithNoteId
    });

  } catch (error: any) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ruta para probar agregación
router.get('/test-aggregation/:noteId?', [validateJWT], async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { noteId } = req.params;
    
    console.log('🧪 Testing aggregation for user:', user._id.toString());
    
    // Pipeline simplificado para test
    const pipeline = [
      // Filtrar por noteId específico si se proporciona
      ...(noteId ? [{ $match: { _id: new mongoose.Types.ObjectId(noteId) } }] : []),
      
      // Filtrar solo notas públicas si no hay noteId específico
      ...(!noteId ? [{ $match: { visibility: 'public' } }] : []),
      
      // Lookup para verificar likes
      {
        $lookup: {
          from: 'notelikes',
          let: { noteId: '$_id', currentUser: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$noteId', '$$noteId'] },
                    { $eq: ['$userId', '$$currentUser'] }
                  ]
                }
              }
            }
          ],
          as: 'currentUserLike'
        }
      },
      
      // Agregar campos de debug
      {
        $addFields: {
          isLikedByCurrentUser: { $gt: [{ $size: '$currentUserLike' }, 0] },
          debugInfo: {
            currentUserLikeCount: { $size: '$currentUserLike' },
            currentUserId: user._id,
            noteId: '$_id'
          }
        }
      },
      
      { $limit: 5 } // Limitar para test
    ];
    
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    const result = await mongoose.connection.db.collection('notes').aggregate(pipeline).toArray();
    
    console.log('📊 Aggregation test result:', JSON.stringify(result, null, 2));
    
    res.json({
      message: 'Aggregation test completed',
      userId: user._id.toString(),
      resultCount: result.length,
      results: result
    });
    
  } catch (error: any) {
    console.error('❌ Aggregation test error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Ruta simple para verificar que el backend funciona
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({ 
      message: 'Backend is working',
      timestamp: new Date().toISOString(),
      status: 'ok'
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta para verificar la conexión a la base de datos
router.get('/db-status', async (req: Request, res: Response) => {
  try {
    if (!mongoose.connection.db) {
      res.status(500).json({ message: 'Database not connected' });
      return;
    }
    
    // Contar documentos en las colecciones principales
    const [notesCount, noteLikesCount] = await Promise.all([
      mongoose.connection.db.collection('notes').countDocuments(),
      mongoose.connection.db.collection('notelikes').countDocuments()
    ]);
    
    res.json({
      message: 'Database connected',
      collections: {
        notes: notesCount,
        notelikes: noteLikesCount
      },
      connectionState: mongoose.connection.readyState // 1 = connected
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta simple para obtener notas públicas sin agregación (para debug)
router.get('/simple-public-notes', [validateJWT], async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    console.log('🔍 simple-public-notes called by user:', user._id.toString());
    
    if (!mongoose.connection.db) {
      throw new Error('Database not connected');
    }
    
    // Obtener notas públicas sin agregación
    const notes = await mongoose.connection.db.collection('notes')
      .find({ visibility: 'public' })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('📊 Found notes:', notes.length);
    
    res.json({
      message: 'Simple public notes',
      userId: user._id.toString(),
      count: notes.length,
      notes: notes
    });
    
  } catch (error: any) {
    console.error('❌ Simple public notes error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
