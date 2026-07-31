import type { ErrorHandler } from "@hono/hono";
import { StatusCodes } from "http-status-codes";
import * as z from "@zod/zod";

import type { ApiErrorResponse } from "../rest-api.d.ts";
import { MadaAdmConfigConflictError } from "@scope/queries/helpers";
import { AppHTTPException } from "../errors/app-http-exception.error.ts";
import { ResponseErrorCode } from "../consts/response-error-code.const.ts";

export const errorHandlerMiddleware: ErrorHandler = (err, c) => {
  if (err instanceof z.ZodError) {
    return c.json<ApiErrorResponse>(
      {
        error: err.issues.map((issue) => issue.message).join(" || "),
        code: ResponseErrorCode.ValidationError,
        data: err.issues,
      },
      StatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  if (err instanceof MadaAdmConfigConflictError) {
    return c.json<ApiErrorResponse>(
      {
        error: err.message,
        code: ResponseErrorCode.MadaAdmConfigConflict,
        data: err.data,
      },
      StatusCodes.BAD_REQUEST,
    );
  }

  if (err instanceof AppHTTPException) {
    return c.json<ApiErrorResponse>(
      {
        error: err.message,
        code: err.code,
        cause: err.cause,
      },
      err,
    );
  }

  return c.json<ApiErrorResponse>(
    {
      error: err.message || "An unexpected error occurred",
      code: ResponseErrorCode.UnexpectedError,
    },
    StatusCodes.INTERNAL_SERVER_ERROR,
  );
};
