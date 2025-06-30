import { Response } from "express";

export enum HttpStatusCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER = 500
}

export interface ErrorResponse {
  message: string;
  code: number;
  data?: any;
  stack?: string;
}

/**
 * Maneja errores HTTP y envía respuestas apropiadas
 * @param res - Express Response object
 * @param message - Mensaje de error para el cliente
 * @param options - Opciones adicionales para personalizar la respuesta
 */
const handleError = (
  res: Response,
  message: string,
  options?: {
    statusCode?: HttpStatusCode | number;
    data?: any;
    logError?: boolean;
    includeStack?: boolean;
  }
) => {
  const statusCode = options?.statusCode || HttpStatusCode.INTERNAL_SERVER;
  const logError = options?.logError !== false;
  
  const errorResponse: ErrorResponse = {
    message,
    code: statusCode,
  };

  if (options?.data) {
    errorResponse.data = options.data;
  }

  if (options?.includeStack && options.data instanceof Error) {
    errorResponse.stack = options.data.stack;
  }

  if (logError) {
    console.error(`[ERROR] ${message}`, options?.data || '');
  }
  return res.status(statusCode).json(errorResponse);
};

export default handleError;