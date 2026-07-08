import type { PrismaClient } from "@prisma/client";
import type {
  TyreCatalogueOption,
  TyreCatalogueRepository
} from "../../modules/tyres/tyreCatalogueService.js";

function toTyreOption(item: {
  id: string;
  size: string;
  width: number;
  profile: number;
  rim: number;
  brand: string;
  category: string;
  price: unknown;
  fitted_price: unknown;
  availability_status: string;
  quantity_available: number | null;
  is_placeholder_seed_data: boolean;
  notes: string | null;
  active: boolean;
}): TyreCatalogueOption {
  return {
    ...item,
    price: Number(item.price),
    fitted_price: Number(item.fitted_price)
  };
}

export class PrismaTyreCatalogueRepository implements TyreCatalogueRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findActiveBySize(size: string): Promise<TyreCatalogueOption[]> {
    const items = await this.prisma.tyreCatalogue.findMany({
      where: {
        size,
        active: true
      },
      orderBy: [{ category: "asc" }, { fitted_price: "asc" }]
    });

    return items.map(toTyreOption);
  }

  async list(search?: string): Promise<TyreCatalogueOption[]> {
    const items = await this.prisma.tyreCatalogue.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { size: { contains: search, mode: "insensitive" as const } },
                { brand: { contains: search, mode: "insensitive" as const } },
                { category: { contains: search, mode: "insensitive" as const } }
              ]
            }
          : {})
      },
      orderBy: [{ size: "asc" }, { fitted_price: "asc" }]
    });

    return items.map(toTyreOption);
  }

  async create(input: {
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
  }): Promise<TyreCatalogueOption> {
    const item = await this.prisma.tyreCatalogue.create({ data: input });
    return toTyreOption(item);
  }

  async update(id: string, input: Partial<Parameters<PrismaTyreCatalogueRepository["create"]>[0]>) {
    const item = await this.prisma.tyreCatalogue.update({
      where: { id },
      data: input
    });
    return toTyreOption(item);
  }
}

