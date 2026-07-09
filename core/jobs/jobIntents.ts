const cancellationPatterns = [
  /\bcancel\b/i,
  /can't make it/i,
  /cant make it/i,
  /no longer need/i
];

const reschedulePatterns = [
  /\bchange (the )?time\b/i,
  /\bcome later\b/i,
  /\bmove it\b/i,
  /\brebook\b/i,
  /not home yet/i,
  /\breschedul/i
];

export function isCancellationIntent(message: string): boolean {
  return cancellationPatterns.some((pattern) => pattern.test(message));
}

export function isRescheduleIntent(message: string): boolean {
  return reschedulePatterns.some((pattern) => pattern.test(message));
}

