export interface HealthCheckResult {
  status: "ok" | "degraded";
  service: string;
  timestamp: string;
  database: "configured" | "missing";
}

export function getHealth(databaseUrl?: string): HealthCheckResult {
  return {
    status: "ok",
    service: "whatsapp-business-platform",
    timestamp: new Date().toISOString(),
    database: databaseUrl ? "configured" : "missing"
  };
}
