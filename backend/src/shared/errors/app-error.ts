export type ErrorDetails = Record<string, string | number | boolean | null>;

export type ErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: ErrorDetails;
  };
  trace_id: string;
};

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: ErrorDetails;

  constructor(code: string, message: string, statusCode = 400, details?: ErrorDetails) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  toPayload(traceId: string): ErrorPayload {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      trace_id: traceId,
    };
  }
}
