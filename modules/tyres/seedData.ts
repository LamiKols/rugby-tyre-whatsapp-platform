export interface TyreSeedOption {
  size: string;
  width: number;
  profile: number;
  rim: number;
  brand: string;
  category: "Budget" | "Mid-range" | "Premium";
  price: number;
  fitted_price: number;
  availability_status: string;
  quantity_available: number;
  is_placeholder_seed_data: boolean;
  notes: string;
  active: boolean;
}

const sizes = [
  { size: "195/55/R16", width: 195, profile: 55, rim: 16, base: 58 },
  { size: "205/55/R16", width: 205, profile: 55, rim: 16, base: 65 },
  { size: "225/45/R17", width: 225, profile: 45, rim: 17, base: 76 },
  { size: "225/40/R18", width: 225, profile: 40, rim: 18, base: 84 },
  { size: "215/55/R17", width: 215, profile: 55, rim: 17, base: 78 },
  { size: "205/60/R16", width: 205, profile: 60, rim: 16, base: 70 },
  { size: "195/65/R15", width: 195, profile: 65, rim: 15, base: 55 },
  { size: "235/45/R18", width: 235, profile: 45, rim: 18, base: 92 },
  { size: "215/60/R16", width: 215, profile: 60, rim: 16, base: 72 },
  { size: "255/35/R19", width: 255, profile: 35, rim: 19, base: 112 }
];

export const tyreSeedData: TyreSeedOption[] = sizes.flatMap((size) => [
  {
    ...size,
    brand: "Budget brand",
    category: "Budget",
    price: size.base - 8,
    fitted_price: size.base,
    availability_status: "available",
    quantity_available: 4,
    is_placeholder_seed_data: true,
    notes: "Placeholder Phase 1 seed price. Confirm with Rugby Tyre Services.",
    active: true
  },
  {
    ...size,
    brand: "Mid-range brand",
    category: "Mid-range",
    price: size.base + 9,
    fitted_price: size.base + 17,
    availability_status: "available",
    quantity_available: 3,
    is_placeholder_seed_data: true,
    notes: "Placeholder Phase 1 seed price. Confirm with Rugby Tyre Services.",
    active: true
  },
  {
    ...size,
    brand: "Premium brand",
    category: "Premium",
    price: size.base + 33,
    fitted_price: size.base + 45,
    availability_status: "available",
    quantity_available: 2,
    is_placeholder_seed_data: true,
    notes: "Placeholder Phase 1 seed price. Confirm with Rugby Tyre Services.",
    active: true
  }
]);

