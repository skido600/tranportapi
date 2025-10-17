import type { Request, Response, NextFunction, Errback } from "express";

const HandleError = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    status: 500,
    message: err.message || "somethinh went wrong",
  });
};

const notFound = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
  });
};

export { HandleError, notFound };
