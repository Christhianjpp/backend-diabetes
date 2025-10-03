import User from "../models/user";
import BlockedUser from "../models/blocked-user";
import NoteLike from "../models/note-like";
import { Types } from "mongoose";

/**
 * Servicio para gestionar el bloqueo de usuarios
 */

interface BlockUserData {
  blockerId: string;
  blockedUserId: string;
  reason?: string;
}

interface BlockUserResult {
  success: boolean;
  block?: any;
  error?: string;
}

/**
 * Obtener lista de IDs de usuarios bloqueados por un usuario
 * Consulta directamente la colección BlockedUser para obtener los IDs
 */
export const getBlockedUserIds = async (userId: string): Promise<string[]> => {
  try {
    const blockedUsers = await BlockedUser.find({ blockerId: userId }).select('blockedUserId');
    const blockedIds = blockedUsers.map(block => block.blockedUserId);
    console.log(`🔍 Usuario ${userId} ha bloqueado a:`, blockedIds);
    return blockedIds;
  } catch (error) {
    console.error('Error obteniendo usuarios bloqueados:', error);
    return [];
  }
};

/**
 * Verificar si un usuario está bloqueado
 */
export const isUserBlocked = async (blockerId: string, blockedUserId: string): Promise<boolean> => {
  try {
    const block = await BlockedUser.findOne({ blockerId, blockedUserId });
    return !!block;
  } catch (error) {
    console.error('Error verificando bloqueo:', error);
    return false;
  }
};

/**
 * Validar que los usuarios existan y sean válidos para el bloqueo
 */
const validateBlockUsers = async (blockerId: string, blockedUserId: string) => {
  // Verificar auto-bloqueo
  if (blockerId === blockedUserId) {
    throw new Error("No puedes bloquearte a ti mismo");
  }

  // Verificar usuario a bloquear
  const blockedUser = await User.findById(blockedUserId);
  if (!blockedUser) {
    throw new Error("El usuario a bloquear no existe");
  }

  if (!blockedUser.name) {
    throw new Error("El usuario a bloquear no tiene nombre válido");
  }

  // Verificar usuario bloqueador
  const blockerUser = await User.findById(blockerId);
  if (!blockerUser) {
    throw new Error("Usuario bloqueador no encontrado");
  }

  // Verificar si ya está bloqueado
  const existingBlock = await BlockedUser.findOne({ blockerId, blockedUserId });
  if (existingBlock) {
    throw new Error("Este usuario ya está bloqueado");
  }

  return { blockedUser, blockerUser };
};

/**
 * Limpiar relaciones entre usuarios (usuarios guardados)
 */
const cleanUserRelations = async (blockerId: string, blockedUserId: string) => {
  await Promise.all([
    User.findByIdAndUpdate(blockerId, { $pull: { usersSaved: blockedUserId } }),
    User.findByIdAndUpdate(blockedUserId, { $pull: { usersSaved: blockerId } })
  ]);
};

/**
 * Limpiar interacciones (likes, comentarios, etc.)
 */
const cleanInteractions = async (blockerId: string, blockedUserId: string) => {
  // Limpiar likes mutuos
  await NoteLike.deleteMany({
    $or: [
      { userId: blockerId, likedUserId: blockedUserId },
      { userId: blockedUserId, likedUserId: blockerId }
    ]
  });

  // Aquí se pueden agregar más limpiezas según sea necesario
};

/**
 * Actualizar el modelo User con información del bloqueo
 */
const updateUserBlockInfo = async (
  blockerId: string, 
  blockedUserId: string, 
  blockerName: string
) => {
  await Promise.all([
    // Incrementar contador de violaciones
    User.findByIdAndUpdate(
      blockedUserId,
      { $inc: { violations: 1 } }
    ),
    // Crear notificación
    User.findByIdAndUpdate(
      blockedUserId,
      {
        $push: {
          notifications: {
            typeNotification: 'alert',
            message: `El usuario ${blockerName} te ha bloqueado`,
            read: false,
          }
        }
      }
    )
  ]);
};

/**
 * Bloquear un usuario (función principal)
 */
export const blockUserService = async (data: BlockUserData): Promise<BlockUserResult> => {
  const { blockerId, blockedUserId, reason } = data;

  try {
    // 1. Validar usuarios
    const { blockedUser, blockerUser } = await validateBlockUsers(blockerId, blockedUserId);

    // 2. Crear el registro de bloqueo
    const block = new BlockedUser({
      blockerId,
      blockedUserId,
      blockedUserName: blockedUser.name,
      blockedUserImg: blockedUser.img,
      reason,
      createdAt: Date.now(),
    });

    await block.save();
    console.log(`💾 Registro de bloqueo guardado:`, block.toJSON());

    // 3. Ejecutar operaciones de limpieza en paralelo
    await Promise.all([
      cleanUserRelations(blockerId, blockedUserId),
      cleanInteractions(blockerId, blockedUserId),
      updateUserBlockInfo(blockerId, blockedUserId, blockerUser.name)
    ]);

    console.log(`✅ Usuario ${blockedUserId} bloqueado por ${blockerId}`);

    // 4. Verificar que el bloqueo se guardó correctamente
    const verificationBlock = await BlockedUser.findOne({ blockerId, blockedUserId });
    console.log(`🔍 Verificación de bloqueo:`, verificationBlock ? 'EXITOSO' : 'FALLO');

    return {
      success: true,
      block: block.toJSON()
    };

  } catch (error: any) {
    console.error("❌ Error en bloqueo de usuario:", error);
    return {
      success: false,
      error: error.message || "Error al bloquear usuario"
    };
  }
};

/**
 * Desbloquear un usuario
 */
export const unblockUserService = async (blockerId: string, blockedUserId: string): Promise<BlockUserResult> => {
  try {
    // Eliminar el registro de bloqueo
    const block = await BlockedUser.findOneAndDelete({ blockerId, blockedUserId });

    if (!block) {
      throw new Error("Este usuario no está bloqueado");
    }

    // Decrementar contador de violaciones
    await User.findByIdAndUpdate(
      blockedUserId,
      { $inc: { violations: -1 } }
    );

    console.log(`✅ Usuario ${blockedUserId} desbloqueado por ${blockerId}`);

    return {
      success: true
    };

  } catch (error: any) {
    console.error("❌ Error en desbloqueo de usuario:", error);
    return {
      success: false,
      error: error.message || "Error al desbloquear usuario"
    };
  }
};

/**
 * Obtener lista de usuarios bloqueados con paginación
 */
export const getBlockedUsersService = async (
  blockerId: string, 
  desde: number = 0, 
  limit: number = 20
) => {
  try {
    const [total, blockedUsers] = await Promise.all([
      BlockedUser.countDocuments({ blockerId }),
      BlockedUser.find({ blockerId })
        .sort({ createdAt: -1 })
        .skip(desde)
        .limit(limit)
    ]);

    return {
      success: true,
      total,
      blockedUsers
    };

  } catch (error: any) {
    console.error("❌ Error obteniendo usuarios bloqueados:", error);
    return {
      success: false,
      error: error.message || "Error al obtener usuarios bloqueados"
    };
  }
};
