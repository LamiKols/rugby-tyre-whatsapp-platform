import { parseTyreSize } from "./tyreSize.js";

export interface TyreCatalogueOption {
  id: string;
  size: string;
  width: number;
  profile: number;
  rim: number;
  brand: string;
  category: string;
  price: number;
  fitted_price: number;
  availability_status: string;
  quantity_available?: number | null;
  is_placeholder_seed_data: boolean;
  notes?: string | null;
  active: boolean;
}

export interface TyreCatalogueRepository {
  findActiveBySize(size: string): Promise<TyreCatalogueOption[]>;
}

export async function lookupTyresByCustomerInput(
  input: string,
  repository: TyreCatalogueRepository
) {
  const parsed = parseTyreSize(input);

  if (!parsed) {
    return {
      parsed: null,
      options: []
    };
  }

  return {
    parsed,
    options: await repository.findActiveBySize(parsed.canonical)
  };
}

