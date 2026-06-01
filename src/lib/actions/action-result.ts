export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult = {
  success: boolean;
  message?: string;
  errorCode?: string;
};

export type ActionResultWithFields = ActionResult & {
  fieldErrors?: FieldErrors;
};

export function successResult<T extends object = Record<string, never>>(
  message: string,
  extra?: T,
): ActionResult & T {
  return {
    success: true,
    message,
    ...(extra ?? ({} as T)),
  };
}

export function errorResult<T extends object = Record<string, never>>(
  message: string,
  errorCode?: string,
  extra?: T,
): ActionResult & T {
  return {
    success: false,
    message,
    errorCode,
    ...(extra ?? ({} as T)),
  };
}

export function logServerError(context: string, error: unknown, details?: Record<string, unknown>) {
  console.error(`[action] ${context}`, {
    ...(details ?? {}),
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  });
}
