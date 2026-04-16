import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../utils/ApiError";

/**
 * Validates the specified request property (body | query | params) against a Zod schema.
 */
export const validate = (schema: AnyZodObject, property: "body" | "query" | "params" = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[property]);
      // Replace with parsed (coerced) values
      (req as Record<string, unknown>)[property] = parsed;
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
