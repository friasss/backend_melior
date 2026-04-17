import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

export const validate = (schema: ZodTypeAny, property: "body" | "query" | "params" = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[property]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any)[property] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".");
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(issue.message);
        }
        next(ApiError.badRequest("Error de validación", fieldErrors));
      } else {
        next(error);
      }
    }
  };
};
