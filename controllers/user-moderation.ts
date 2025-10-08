import { Request, Response } from "express";
import handleError, { HttpStatusCode } from "../helpers/error-handle";
import UserReport from "../models/user-report";
import BlockedUser from "../models/blocked-user";
import User from "../models/user";
import { 
  blockUserService, 
  unblockUserService, 
  getBlockedUsersService,
  isUserBlocked 
} from "../services/userBlocking";

// Reportar usuario
export const reportUser = async (req: Request, res: Response) => {
  try {
    const { reportedUserId, commentId, noteId, reason, description } = req.body;
    const reporterId = req.user?.uid;

    // Verificar que no se esté reportando a sí mismo
    if (reporterId === reportedUserId) {
      return handleError(res, "No puedes reportarte a ti mismo", { statusCode: HttpStatusCode.BAD_REQUEST });
    }

    // Verificar que el usuario reportado existe
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return handleError(res, "El usuario reportado no existe", { statusCode: HttpStatusCode.NOT_FOUND });
    }

    // Verificar si ya existe un reporte del mismo contenido por el mismo usuario
    const existingQuery: any = { reporterId, reportedUserId };
    if (commentId) existingQuery.commentId = commentId;
    if (noteId) existingQuery.noteId = noteId;

    const existingReport = await UserReport.findOne(existingQuery);
    if (existingReport) {
      return res.status(200).json({
        success: true,
        message: "Ya reportaste este contenido",
        report: existingReport,
      });
    }

    // Crear el reporte
    const report = new UserReport({
      reporterId,
      reportedUserId,
      commentId,
      noteId,
      reason,
      description,
      status: 'pending',
      createdAt: Date.now(),
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: "Reporte enviado correctamente",
      report,
    });
  } catch (error: any) {
    // Manejar error de duplicado por índice único como respaldo
    if (error?.code === 11000) {
      return handleError(res, "Ya reportaste este contenido", { statusCode: HttpStatusCode.BAD_REQUEST, logError: false });
    }
    handleError(res, "ERROR_CREATE_REPORT", error);
  }
};

// Bloquear usuario
export const blockUser = async (req: Request, res: Response) => {
  try {
    const { blockedUserId, reason } = req.body;
    const blockerId = req.user?.uid;

    // Validación básica de autenticación
    if (!blockerId) {
      return handleError(res, "Usuario no autenticado", { 
        statusCode: HttpStatusCode.UNAUTHORIZED 
      });
    }

    // Validación de datos de entrada
    if (!blockedUserId) {
      return handleError(res, "blockedUserId es requerido", { 
        statusCode: HttpStatusCode.BAD_REQUEST 
      });
    }

    // Ejecutar servicio de bloqueo
    const result = await blockUserService({
      blockerId,
      blockedUserId,
      reason
    });

    // Manejar resultado
    if (!result.success) {
      const statusCode = result.error?.includes("no existe") 
        ? HttpStatusCode.NOT_FOUND 
        : HttpStatusCode.BAD_REQUEST;
      
      return handleError(res, result.error || "Error al bloquear usuario", { 
        statusCode 
      });
    }

    res.status(201).json({
      success: true,
      message: "Usuario bloqueado correctamente",
      block: result.block,
    });

  } catch (error: any) {
    console.error("ERROR_BLOCK_USER:", error);
    handleError(res, "Error al bloquear usuario", { 
      statusCode: HttpStatusCode.INTERNAL_SERVER 
    });
  }
};

// Desbloquear usuario
export const unblockUser = async (req: Request, res: Response) => {
  try {
    const { blockedUserId } = req.params;
    const blockerId = req.user?.uid;

    // Validación de autenticación
    if (!blockerId) {
      return handleError(res, "Usuario no autenticado", { 
        statusCode: HttpStatusCode.UNAUTHORIZED 
      });
    }

    // Ejecutar servicio de desbloqueo
    const result = await unblockUserService(blockerId, blockedUserId);

    // Manejar resultado
    if (!result.success) {
      return handleError(res, result.error || "Error al desbloquear usuario", { 
        statusCode: HttpStatusCode.NOT_FOUND 
      });
    }

    res.status(200).json({
      success: true,
      message: "Usuario desbloqueado correctamente",
    });

  } catch (error: any) {
    console.error("ERROR_UNBLOCK_USER:", error);
    handleError(res, "Error al desbloquear usuario", { 
      statusCode: HttpStatusCode.INTERNAL_SERVER 
    });
  }
};

// Obtener usuarios bloqueados por el usuario actual
export const getBlockedUsers = async (req: Request, res: Response) => {
  try {
    const blockerId = req.user?.uid;
    const { desde = 0, limit = 20 } = req.query;

    // Validación de autenticación
    if (!blockerId) {
      return handleError(res, "Usuario no autenticado", { 
        statusCode: HttpStatusCode.UNAUTHORIZED 
      });
    }

    // Ejecutar servicio de obtención de bloqueados
    const result = await getBlockedUsersService(
      blockerId, 
      Number(desde), 
      Number(limit)
    );

    // Manejar resultado
    if (!result.success) {
      return handleError(res, result.error || "Error al obtener usuarios bloqueados", { 
        statusCode: HttpStatusCode.INTERNAL_SERVER 
      });
    }

    res.status(200).json({
      success: true,
      total: result.total,
      blockedUsers: result.blockedUsers,
    });

  } catch (error: any) {
    console.error("ERROR_GET_BLOCKED_USERS:", error);
    handleError(res, "Error al obtener usuarios bloqueados", { 
      statusCode: HttpStatusCode.INTERNAL_SERVER 
    });
  }
};

// Obtener mis reportes
export const getMyReports = async (req: Request, res: Response) => {
  try {
    const reporterId = req.user?.uid;
    const { desde = 0, limit = 20 } = req.query;

    const [total, reports] = await Promise.all([
      UserReport.countDocuments({ reporterId }),
      UserReport.find({ reporterId })
        .populate('reportedUserId', 'name img')
        .sort({ createdAt: -1 })
        .skip(Number(desde))
        .limit(Number(limit)),
    ]);

    res.status(200).json({
      success: true,
      total,
      reports,
    });
  } catch (error: any) {
    handleError(res, "ERROR_GET_MY_REPORTS", error);
  }
};

// Verificar si un usuario está bloqueado
export const isUserBlockedController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user?.uid;

    // Validación de autenticación
    if (!blockerId) {
      return handleError(res, "Usuario no autenticado", { 
        statusCode: HttpStatusCode.UNAUTHORIZED 
      });
    }

    // Ejecutar servicio de verificación
    const blocked = await isUserBlocked(blockerId, userId);

    res.status(200).json({
      success: true,
      isBlocked: blocked,
    });

  } catch (error: any) {
    console.error("ERROR_CHECK_BLOCKED_USER:", error);
    handleError(res, "Error al verificar bloqueo", { 
      statusCode: HttpStatusCode.INTERNAL_SERVER 
    });
  }
};

// Obtener reporte por ID (para administradores)
export const getReportById = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await UserReport.findById(reportId)
      .populate('reporterId', 'name img')
      .populate('reportedUserId', 'name img');

    if (!report) {
      return handleError(res, "Reporte no encontrado", { statusCode: HttpStatusCode.NOT_FOUND });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error: any) {
    handleError(res, "ERROR_GET_REPORT", error);
  }
};

// Actualizar estado de reporte (para administradores)
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    const reviewerId = req.user?.uid;

    const report = await UserReport.findByIdAndUpdate(
      reportId,
      {
        status,
        reviewedAt: Date.now(),
        reviewedBy: reviewerId,
      },
      { new: true }
    );

    if (!report) {
      return handleError(res, "Reporte no encontrado", { statusCode: HttpStatusCode.NOT_FOUND });
    }

    res.status(200).json({
      success: true,
      message: "Estado del reporte actualizado correctamente",
      report,
    });
  } catch (error: any) {
    handleError(res, "ERROR_UPDATE_REPORT_STATUS", error);
  }
};
