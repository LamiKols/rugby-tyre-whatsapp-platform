import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../core/security/adminAuth.js";
import { tyreSeedData, type TyreSeedOption } from "../modules/tyres/seedData.js";

const prisma = new PrismaClient();

function tyreSeedId(tyre: Pick<TyreSeedOption, "size" | "category">) {
  return `${tyre.size}-${tyre.category}`.replace(/[^A-Za-z0-9]/g, "-").toLowerCase();
}

function tyreCataloguePayload(tyre: TyreSeedOption) {
  return {
    size: tyre.size,
    width: tyre.width,
    profile: tyre.profile,
    rim: tyre.rim,
    brand: tyre.brand,
    category: tyre.category,
    price: tyre.price,
    fitted_price: tyre.fitted_price,
    availability_status: tyre.availability_status,
    quantity_available: tyre.quantity_available,
    is_placeholder_seed_data: tyre.is_placeholder_seed_data,
    notes: tyre.notes,
    active: tyre.active
  };
}

async function main() {
  const seedOwnerEmail = process.env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  const seedOwnerPassword = process.env.SEED_OWNER_PASSWORD;
  const seedOwnerName = process.env.SEED_OWNER_NAME?.trim() || "Rugby Tyre Services Owner";

  if (seedOwnerEmail && seedOwnerPassword) {
    const existingOwner = await prisma.user.findUnique({
      where: { email: seedOwnerEmail }
    });

    if (!existingOwner) {
      await prisma.user.create({
        data: {
          name: seedOwnerName,
          email: seedOwnerEmail,
          password_hash: await hashPassword(seedOwnerPassword),
          role: "owner",
          active: true
        }
      });
    }
  }

  for (const tyre of tyreSeedData) {
    const payload = tyreCataloguePayload(tyre);

    await prisma.tyreCatalogue.upsert({
      where: {
        id: tyreSeedId(tyre)
      },
      update: payload,
      create: {
        id: tyreSeedId(tyre),
        ...payload
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
