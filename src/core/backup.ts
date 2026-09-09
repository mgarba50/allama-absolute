export interface AbsoluteBackupEnvelope {
  format: "allama-absolute-backup";
  version: 1;
  createdAt: string;
  methodologyVersion: string;
  payload: {
    cases?: unknown[];
    casts?: unknown[];
    predictions?: unknown[];
    outcomes?: unknown[];
    rules?: unknown[];
    sources?: unknown[];
    calibration?: unknown[];
    settings?: Record<string,unknown>;
  };
}

export function createBackupEnvelope(
  payload: AbsoluteBackupEnvelope["payload"],
  methodologyVersion: string,
  createdAt = new Date().toISOString()
): AbsoluteBackupEnvelope {
  return {
    format:"allama-absolute-backup",
    version:1,
    createdAt,
    methodologyVersion,
    payload
  };
}

export function validateBackupEnvelope(value: unknown): value is AbsoluteBackupEnvelope {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string,unknown>;
  return record.format === "allama-absolute-backup" &&
    record.version === 1 &&
    typeof record.createdAt === "string" &&
    typeof record.methodologyVersion === "string" &&
    typeof record.payload === "object" &&
    record.payload !== null;
}
