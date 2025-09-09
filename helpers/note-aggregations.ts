import { Types } from 'mongoose';

/**
 * Pipeline de agregación para obtener notas con estado de like del usuario actual
 * Implementa el patrón N-a-N con denormalización de contador
 */
export const getNotesWithLikeStatusPipeline = (currentUserId: string) => [
  // 1. Lookup para verificar si el usuario actual dio like a cada nota
  {
    $lookup: {
      from: 'notelikes',
      let: { noteId: '$_id', currentUser: new Types.ObjectId(currentUserId) },
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
        { $limit: 1 }  // Solo necesitamos saber si existe
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
    $unset: ['currentUserLike']  // Remover campo temporal
  }
];

/**
 * Pipeline para obtener notas públicas con paginación y estado de like
 */
export const getPublicNotesWithLikesPipeline = (
  currentUserId: string, 
  skip: number = 0, 
  limit: number = 10
) => [
  // 1. Filtrar solo notas públicas
  {
    $match: { visibility: 'public' }
  },
  
  // 2. Agregar información de likes del usuario actual
  ...getNotesWithLikeStatusPipeline(currentUserId),
  
  // 3. Populate userId (información del creador)
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'userInfo',
      pipeline: [
        { $project: { name: 1, img: 1 } }  // Solo campos necesarios
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
    $sort: { createdAt: -1 as const }
  },
  
  // 8. Paginación
  { $skip: skip },
  { $limit: limit }
];

/**
 * Pipeline para obtener notas del usuario con estado de like
 */
export const getMyNotesWithLikesPipeline = (currentUserId: string) => [
  // 1. Filtrar solo notas del usuario actual
  {
    $match: { userId: new Types.ObjectId(currentUserId) }
  },
  
  // 2. Agregar información de likes (aunque sean propias, puede ser útil)
  ...getNotesWithLikeStatusPipeline(currentUserId),
  
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
    $sort: { updatedAt: -1 as const }
  }
];

/**
 * Pipeline para contar notas públicas
 */
export const countPublicNotesPipeline = () => [
  {
    $match: { visibility: 'public' }
  },
  {
    $count: 'total'
  }
];
