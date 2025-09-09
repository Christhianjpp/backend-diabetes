"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.countPublicNotesPipeline = exports.getMyNotesWithLikesPipeline = exports.getPublicNotesWithLikesPipeline = exports.getNotesWithLikeStatusPipeline = void 0;
const mongoose_1 = require("mongoose");
/**
 * Pipeline de agregación para obtener notas con estado de like del usuario actual
 * Implementa el patrón N-a-N con denormalización de contador
 */
const getNotesWithLikeStatusPipeline = (currentUserId) => [
    // 1. Lookup para verificar si el usuario actual dio like a cada nota
    {
        $lookup: {
            from: 'notelikes',
            let: { noteId: '$_id', currentUser: new mongoose_1.Types.ObjectId(currentUserId) },
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
                },
                { $limit: 1 } // Solo necesitamos saber si existe
            ],
            as: 'currentUserLike'
        }
    },
    // 2. Agregar campo isLikedByCurrentUser basado en el lookup
    {
        $addFields: {
            isLikedByCurrentUser: { $gt: [{ $size: '$currentUserLike' }, 0] }
        }
    },
    // Debug: Log para verificar el pipeline (remover en producción)
    {
        $addFields: {
            debugInfo: {
                currentUserLikeCount: { $size: '$currentUserLike' },
                isLikedByCurrentUser: { $gt: [{ $size: '$currentUserLike' }, 0] }
            }
        }
    },
    // 3. Limpiar campos temporales (usar $unset es más seguro que $project para exclusión)
    {
        $unset: ['currentUserLike'] // Remover campo temporal
    }
];
exports.getNotesWithLikeStatusPipeline = getNotesWithLikeStatusPipeline;
/**
 * Pipeline para obtener notas públicas con paginación y estado de like
 */
const getPublicNotesWithLikesPipeline = (currentUserId, skip = 0, limit = 10) => [
    // 1. Filtrar solo notas públicas
    {
        $match: { visibility: 'public' }
    },
    // 2. Agregar información de likes del usuario actual
    ...(0, exports.getNotesWithLikeStatusPipeline)(currentUserId),
    // 3. Populate userId (información del creador)
    {
        $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo',
            pipeline: [
                { $project: { name: 1, img: 1 } } // Solo campos necesarios
            ]
        }
    },
    // 4. Populate categoryId
    {
        $lookup: {
            from: 'categorynotes',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryInfo',
            pipeline: [
                { $project: { name: 1, emoji: 1, color: 1 } }
            ]
        }
    },
    // 5. Restructurar datos para compatibilidad
    {
        $addFields: {
            userId: { $arrayElemAt: ['$userInfo', 0] },
            categoryId: { $arrayElemAt: ['$categoryInfo', 0] }
        }
    },
    // 6. Limpiar campos temporales
    {
        $unset: ['userInfo', 'categoryInfo']
    },
    // 7. Ordenar por fecha de actualización
    {
        $sort: { createdAt: -1 }
    },
    // 8. Paginación
    { $skip: skip },
    { $limit: limit }
];
exports.getPublicNotesWithLikesPipeline = getPublicNotesWithLikesPipeline;
/**
 * Pipeline para obtener notas del usuario con estado de like
 */
const getMyNotesWithLikesPipeline = (currentUserId) => [
    // 1. Filtrar solo notas del usuario actual
    {
        $match: { userId: new mongoose_1.Types.ObjectId(currentUserId) }
    },
    // 2. Agregar información de likes (aunque sean propias, puede ser útil)
    ...(0, exports.getNotesWithLikeStatusPipeline)(currentUserId),
    // 3. Populate categoryId
    {
        $lookup: {
            from: 'categorynotes',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'categoryInfo',
            pipeline: [
                { $project: { name: 1, emoji: 1, color: 1 } }
            ]
        }
    },
    // 4. Restructurar categoryId
    {
        $addFields: {
            categoryId: { $arrayElemAt: ['$categoryInfo', 0] }
        }
    },
    // 5. Limpiar campos temporales
    {
        $unset: ['categoryInfo']
    },
    // 6. Ordenar por fecha de actualización
    {
        $sort: { updatedAt: -1 }
    }
];
exports.getMyNotesWithLikesPipeline = getMyNotesWithLikesPipeline;
/**
 * Pipeline para contar notas públicas
 */
const countPublicNotesPipeline = () => [
    {
        $match: { visibility: 'public' }
    },
    {
        $count: 'total'
    }
];
exports.countPublicNotesPipeline = countPublicNotesPipeline;
//# sourceMappingURL=note-aggregations.js.map