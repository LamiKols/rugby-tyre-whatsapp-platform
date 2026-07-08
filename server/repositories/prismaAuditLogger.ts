import { type Prisma, type PrismaClient } from "@prisma/client";
import type { AuditLogger, AuditLogInput } from "../../core/audit/auditService.js";

export class PrismaAuditLogger implements AuditLogger {
  constructor(private readonly prisma: PrismaClient) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actor_type: input.actor_type,
        actor_id: input.actor_id,
        action: input.action,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    });
  }
}
