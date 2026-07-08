export interface ParsedTyreSize {
  width: number;
  profile: number;
  rim: number;
  canonical: string;
}

function toCanonical(width: number, profile: number, rim: number): ParsedTyreSize | null {
  if (width < 100 || width > 399 || profile < 20 || profile > 95 || rim < 10 || rim > 30) {
    return null;
  }

  return {
    width,
    profile,
    rim,
    canonical: `${width}/${profile}/R${rim}`
  };
}

export function parseTyreSize(input: string): ParsedTyreSize | null {
  const cleaned = input.trim().toUpperCase();
  const compact = cleaned.replace(/[^0-9]/g, "");

  if (/^\d{7}$/.test(compact)) {
    return toCanonical(
      Number(compact.slice(0, 3)),
      Number(compact.slice(3, 5)),
      Number(compact.slice(5, 7))
    );
  }

  const separated = cleaned.match(/^(\d{3})\s*[\/\-\s]\s*(\d{2})\s*[\/\-\s]\s*R?\s*(\d{2})$/);
  if (!separated) {
    return null;
  }

  return toCanonical(Number(separated[1]), Number(separated[2]), Number(separated[3]));
}

export function normalizeTyreSize(input: string): string | null {
  return parseTyreSize(input)?.canonical ?? null;
}

