export function createQuoteReference(date = new Date()): string {
  const datePart = [
    date.getFullYear().toString().slice(-2),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  const timePart = String(date.getTime()).slice(-5);
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase();

  return `RTS-Q-${datePart}-${timePart}${randomPart}`;
}
