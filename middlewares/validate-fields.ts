import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import handleError, { HttpStatusCode } from "../helpers/error-handle";

const validateFields = (req: Request, res: Response, next: NextFunction) => {
  console.log('validateFields', req.body);
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Extraer solo los mensajes de error
    const errorArray = errors.array();
    const errorMessages = errorArray.map(err => err.msg);
    
    // Usar el primer mensaje o combinarlos si hay múltiples
    const errorMessage = errorMessages.length === 1 
      ? errorMessages[0] 
      : errorMessages.join('. ');
    
    return handleError(res, errorMessage, {
      statusCode: HttpStatusCode.BAD_REQUEST,
      logError: true
    });
  }

  next();
};

export default validateFields;
