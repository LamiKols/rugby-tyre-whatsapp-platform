const HANDOFF_TRIGGERS = new Set(["HELP", "HUMAN", "SPEAK TO SOMEONE"]);

export function isHumanHandoffRequest(message: string): boolean {
  return HANDOFF_TRIGGERS.has(message.trim().toUpperCase());
}

export function handoffPatch(reason: string) {
  return {
    status: "handoff_required",
    current_state: "handoff",
    handoff_required: true,
    handoff_reason: reason,
    failed_attempts: 0
  };
}
