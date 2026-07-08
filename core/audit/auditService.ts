export interface AuditLogInput {
  actor_type: string;
  actor_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogger {
  log(input: AuditLogInput): Promise<void>;
}

export const noopAuditLogger: AuditLogger = {
  async log() {
    return undefined;
  }
};

