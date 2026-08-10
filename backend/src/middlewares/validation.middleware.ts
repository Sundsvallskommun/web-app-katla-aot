import { HttpException } from '@exceptions/HttpException';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';

const getAllNestedErrors = (error: ValidationError): string | string[] => {
  if (error.constraints) {
    return Object.values(error.constraints);
  }
  return (error.children ?? []).map(getAllNestedErrors).join(',');
};

export const validationMiddleware = (
  type: ClassConstructor<object>,
  value: 'body' | 'query' | 'params' = 'body',
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true,
): RequestHandler => {
  return (req, res, next) => {
    const obj = plainToInstance(type, req[value] as Record<string, unknown>);
    void validate(obj, { skipMissingProperties, whitelist, forbidNonWhitelisted }).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        const message = errors.map(getAllNestedErrors).join(', ');
        next(new HttpException(400, message));
      } else {
        next();
      }
    });
  };
};
