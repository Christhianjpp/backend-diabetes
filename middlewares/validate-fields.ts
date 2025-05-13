import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

const validateFields = (req: Request, res: Response, next: NextFunction) => {
  console.log("validateFields");
  
  const errors = validationResult(req);

  console.log(errors);
  if (!errors.isEmpty()) {
    return res.status(400).json(errors);
  }

  next();
};

export default validateFields;
