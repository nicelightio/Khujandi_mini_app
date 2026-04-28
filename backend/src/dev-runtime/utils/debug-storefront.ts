export const summarizeMediaValue = (value: string | null | undefined) => {
  if (value === undefined) {
    return { state: "undefined" };
  }

  if (value === null) {
    return { state: "null" };
  }

  return {
    state: "set",
    length: value.length,
    prefix: value.slice(0, 48),
  };
};

export const logStorefrontDebug = (isDebugEnabled: boolean, event: string, details: Record<string, unknown>) => {
  if (!isDebugEnabled) {
    return;
  }

  console.info(`[debug-storefront] ${event}`, details);
};
