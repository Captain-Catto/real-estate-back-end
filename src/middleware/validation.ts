import { z } from "zod";
import { Request, Response, NextFunction } from "express";

/**
 * Generic validation middleware for Zod schemas
 * @param schema - Zod schema to validate against
 * @param property - Which property to validate (body, query, params)
 */
export const validate = (
  schema: z.ZodSchema,
  property: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[property];
      const validatedData = schema.parse(dataToValidate);

      // Replace the original data with validated data
      req[property] = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = (schema: z.ZodSchema) => validate(schema, "body");

/**
 * Validate query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => validate(schema, "query");

/**
 * Validate route parameters
 */
export const validateParams = (schema: z.ZodSchema) =>
  validate(schema, "params");

/**
 * Custom validation for multiple properties
 */
export const validateMultiple = (schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: any[] = [];

      // Validate body
      if (schemas.body) {
        try {
          req.body = schemas.body.parse(req.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                location: "body",
                field: e.path.join("."),
                message: e.message,
                code: e.code,
              }))
            );
          }
        }
      }

      // Validate query
      if (schemas.query) {
        try {
          req.query = schemas.query.parse(req.query);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                location: "query",
                field: e.path.join("."),
                message: e.message,
                code: e.code,
              }))
            );
          }
        }
      }

      // Validate params
      if (schemas.params) {
        try {
          req.params = schemas.params.parse(req.params);
        } catch (error) {
          if (error instanceof z.ZodError) {
            errors.push(
              ...error.errors.map((e) => ({
                location: "params",
                field: e.path.join("."),
                message: e.message,
                code: e.code,
              }))
            );
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
