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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const middlewares_1 = require("../middlewares");
const mongoose_1 = __importDefault(require("mongoose"));
const router = (0, express_1.Router)();
// Ruta para migrar NoteLikes de itemId a noteId
router.post('/migrate-notelikes', [middlewares_1.validateJWT], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔄 Starting NoteLikes migration...');
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database connection not established');
        }
        const db = mongoose_1.default.connection.db;
        const coll = db.collection('notelikes');
        // 1) Mostrar índices actuales
        const indexes = yield coll.indexes();
        console.log('🧭 Current indexes:', indexes);
        // 2) Eliminar índice legacy si existe (itemId_1_userId_1)
        const legacyIndex = indexes.find((i) => i.name === 'itemId_1_userId_1');
        if (legacyIndex) {
            console.log('🧹 Dropping legacy index itemId_1_userId_1...');
            yield coll.dropIndex('itemId_1_userId_1');
        }
        // 3) Limpiar documentos inválidos (itemId null o ausente)
        const invalidResult = yield coll.deleteMany({ $or: [{ itemId: null }, { itemId: { $exists: false } }] });
        console.log(`🗑️ Removed invalid docs (itemId null/missing): ${invalidResult.deletedCount}`);
        // 4) Deduplicar por (itemId, userId) antes de renombrar
        const duplicateGroups = yield coll.aggregate([
            { $match: { itemId: { $exists: true, $ne: null } } },
            { $group: { _id: { itemId: '$itemId', userId: '$userId' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        let removedDuplicates = 0;
        for (const grp of duplicateGroups) {
            // Mantener el primer id y eliminar el resto
            const [, ...toRemove] = grp.ids;
            if (toRemove.length > 0) {
                const delRes = yield coll.deleteMany({ _id: { $in: toRemove } });
                removedDuplicates += delRes.deletedCount || 0;
            }
        }
        console.log(`🧽 Removed duplicate docs by (itemId,userId): ${removedDuplicates}`);
        // 5) Renombrar itemId -> noteId para todos los restantes
        const renameResult = yield coll.updateMany({ itemId: { $exists: true } }, { $rename: { itemId: 'noteId' } });
        console.log(`✅ Renamed itemId->noteId in ${renameResult.modifiedCount} documents`);
        // 6) Crear índice único nuevo en (noteId,userId) si no existe
        const newIndexes = yield coll.indexes();
        const hasNewIndex = newIndexes.find((i) => i.name === 'noteId_1_userId_1');
        if (!hasNewIndex) {
            console.log('🧩 Creating unique index noteId_1_userId_1...');
            yield coll.createIndex({ noteId: 1, userId: 1 }, { unique: true, name: 'noteId_1_userId_1' });
        }
        // 7) Reporte final
        const totalWithNoteId = yield coll.countDocuments({ noteId: { $exists: true } });
        res.json({
            message: 'Migration completed',
            removedInvalid: invalidResult.deletedCount,
            removedDuplicates,
            renamed: renameResult.modifiedCount,
            totalWithNoteId
        });
    }
    catch (error) {
        console.error('❌ Migration error:', error);
        res.status(500).json({ message: error.message });
    }
}));
// Ruta para probar agregación
router.get('/test-aggregation/:noteId?', [middlewares_1.validateJWT], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { noteId } = req.params;
        console.log('🧪 Testing aggregation for user:', user._id.toString());
        // Pipeline simplificado para test
        const pipeline = [
            // Filtrar por noteId específico si se proporciona
            ...(noteId ? [{ $match: { _id: new mongoose_1.default.Types.ObjectId(noteId) } }] : []),
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
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database connection not established');
        }
        const result = yield mongoose_1.default.connection.db.collection('notes').aggregate(pipeline).toArray();
        console.log('📊 Aggregation test result:', JSON.stringify(result, null, 2));
        res.json({
            message: 'Aggregation test completed',
            userId: user._id.toString(),
            resultCount: result.length,
            results: result
        });
    }
    catch (error) {
        console.error('❌ Aggregation test error:', error);
        res.status(500).json({ message: error.message });
    }
}));
// Ruta simple para verificar que el backend funciona
router.get('/health', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json({
            message: 'Backend is working',
            timestamp: new Date().toISOString(),
            status: 'ok'
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Ruta para verificar la conexión a la base de datos
router.get('/db-status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!mongoose_1.default.connection.db) {
            res.status(500).json({ message: 'Database not connected' });
            return;
        }
        // Contar documentos en las colecciones principales
        const [notesCount, noteLikesCount] = yield Promise.all([
            mongoose_1.default.connection.db.collection('notes').countDocuments(),
            mongoose_1.default.connection.db.collection('notelikes').countDocuments()
        ]);
        res.json({
            message: 'Database connected',
            collections: {
                notes: notesCount,
                notelikes: noteLikesCount
            },
            connectionState: mongoose_1.default.connection.readyState // 1 = connected
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}));
// Ruta simple para obtener notas públicas sin agregación (para debug)
router.get('/simple-public-notes', [middlewares_1.validateJWT], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        console.log('🔍 simple-public-notes called by user:', user._id.toString());
        if (!mongoose_1.default.connection.db) {
            throw new Error('Database not connected');
        }
        // Obtener notas públicas sin agregación
        const notes = yield mongoose_1.default.connection.db.collection('notes')
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
    }
    catch (error) {
        console.error('❌ Simple public notes error:', error);
        res.status(500).json({ message: error.message });
    }
}));
exports.default = router;
//# sourceMappingURL=debug.js.map