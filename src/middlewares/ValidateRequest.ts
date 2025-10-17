import type { NextFunction, Request, Response } from "express";
import type { ObjectSchema } from "joi";
import { HandleResponse } from "../utils/Response.ts";
const validateRequest = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return HandleResponse(res, false, 400, error.details[0]?.message as any);
    }

    next();
  };
};

export default validateRequest;
