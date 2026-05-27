import { HTTPException } from "hono/http-exception";

import type { ResponseErrorCode } from "../consts/response-error-code.const.ts";

export class AppHTTPException extends HTTPException {
  public code: ResponseErrorCode;

  constructor(
    code: ResponseErrorCode,
    ...args: ConstructorParameters<typeof HTTPException>
  ) {
    super(...args);
    this.code = code;
  }
}
