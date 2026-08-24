import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('password123', salt);

  // 1️⃣ Tenant 1: Artisan Brew & Bites (Cafe & Bakery)
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Artisan Brew & Bites',
      slug: 'artisan-brew',
      logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=150&auto=format&fit=crop&q=80',
      currency: 'THB',
      taxRate: 7.0,
      serviceFee: 0.0,
      users: {
        create: [
          {
            name: 'Alex Owner',
            email: 'alex@artisan.com',
            passwordHash: defaultPassword,
            role: 'OWNER',
            pinCode: '1111',
          },
          {
            name: 'Sarah Cashier',
            email: 'sarah@artisan.com',
            passwordHash: defaultPassword,
            role: 'CASHIER',
            pinCode: '2222',
          },
          {
            name: 'Chef Gordon',
            email: 'gordon@artisan.com',
            passwordHash: defaultPassword,
            role: 'KITCHEN',
            pinCode: '3333',
          },
        ],
      },
    },
  });

  // Ingredients for Cafe
  const coffeeBeans = await prisma.ingredient.create({
    data: {
      tenantId: tenant1.id,
      name: 'Specialty Coffee Beans (Brazil Cerrado)',
      unit: 'g',
      currentStock: 2500, // 2.5 kg
      minStockAlert: 500,
      costPerUnit: 0.8,
    },
  });

  const freshMilk = await prisma.ingredient.create({
    data: {
      tenantId: tenant1.id,
      name: 'Fresh Whole Milk',
      unit: 'ml',
      currentStock: 6000, // 6 Liters
      minStockAlert: 1000,
      costPerUnit: 0.06,
    },
  });

  const matchaPowder = await prisma.ingredient.create({
    data: {
      tenantId: tenant1.id,
      name: 'Ceremonial Uji Matcha',
      unit: 'g',
      currentStock: 800,
      minStockAlert: 150,
      costPerUnit: 2.5,
    },
  });

  const butterCroissantDough = await prisma.ingredient.create({
    data: {
      tenantId: tenant1.id,
      name: 'French Butter Dough',
      unit: 'pcs',
      currentStock: 45,
      minStockAlert: 10,
      costPerUnit: 25.0,
    },
  });

  // Tables for Cafe
  const cafeTables = [
    { tableNumber: 'T-01', zone: 'Indoor Window', capacity: 2, qrCodeToken: 'artisan-t01' },
    { tableNumber: 'T-02', zone: 'Indoor Window', capacity: 2, qrCodeToken: 'artisan-t02' },
    { tableNumber: 'T-03', zone: 'Main Hall', capacity: 4, qrCodeToken: 'artisan-t03' },
    { tableNumber: 'T-04', zone: 'Main Hall', capacity: 4, qrCodeToken: 'artisan-t04' },
    { tableNumber: 'T-05', zone: 'Terrace Garden', capacity: 4, qrCodeToken: 'artisan-t05' },
    { tableNumber: 'VIP-1', zone: 'Co-Working Lounge', capacity: 8, qrCodeToken: 'artisan-vip1' },
  ];

  for (const t of cafeTables) {
    await prisma.diningTable.create({
      data: {
        tenantId: tenant1.id,
        tableNumber: t.tableNumber,
        zone: t.zone,
        capacity: t.capacity,
        qrCodeToken: t.qrCodeToken,
        status: 'AVAILABLE',
      },
    });
  }

  // Categories for Cafe
  const catCoffee = await prisma.category.create({
    data: {
      tenantId: tenant1.id,
      name: 'Espresso & Coffee',
      icon: '☕',
      sortOrder: 1,
    },
  });

  const catNonCoffee = await prisma.category.create({
    data: {
      tenantId: tenant1.id,
      name: 'Matcha & Tea',
      icon: '🍵',
      sortOrder: 2,
    },
  });

  const catBakery = await prisma.category.create({
    data: {
      tenantId: tenant1.id,
      name: 'Artisan Bakery',
      icon: '🥐',
      sortOrder: 3,
    },
  });

  const catBrunch = await prisma.category.create({
    data: {
      tenantId: tenant1.id,
      name: 'All-Day Brunch',
      icon: '🍳',
      sortOrder: 4,
    },
  });

  // Menu Items for Cafe
  const icedLatte = await prisma.menuItem.create({
    data: {
      tenantId: tenant1.id,
      categoryId: catCoffee.id,
      name: 'Iced Velvet Latte',
      description: 'Double espresso shot with creamy chilled whole milk over crystal ice.',
      price: 110,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80',
      prepTimeMinutes: 3,
      sortOrder: 1,
      modifierGroups: {
        create: [
          {
            name: 'Sweetness Level',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            options: {
              create: [
                { name: 'No Sugar (0%)', extraPrice: 0 },
                { name: 'Less Sweet (50%)', extraPrice: 0 },
                { name: 'Normal (100%)', extraPrice: 0 },
              ],
            },
          },
          {
            name: 'Milk Option',
            isRequired: false,
            minSelect: 0,
            maxSelect: 1,
            options: {
              create: [
                { name: 'Oat Milk (+฿25)', extraPrice: 25 },
                { name: 'Almond Milk (+฿25)', extraPrice: 25 },
              ],
            },
          },
        ],
      },
    },
  });

  // Recipe link for Iced Latte: 18g beans + 150ml milk
  await prisma.recipeItem.create({
    data: { menuItemId: icedLatte.id, ingredientId: coffeeBeans.id, quantityRequired: 18 },
  });
  await prisma.recipeItem.create({
    data: { menuItemId: icedLatte.id, ingredientId: freshMilk.id, quantityRequired: 150 },
  });

  const dirtyCoffee = await prisma.menuItem.create({
    data: {
      tenantId: tenant1.id,
      categoryId: catCoffee.id,
      name: 'Signature Dirty Coffee',
      description: 'Hot concentrated espresso poured directly over super chilled milk & cream blend.',
      price: 130,
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80',
      prepTimeMinutes: 4,
      sortOrder: 2,
    },
  });

  await prisma.recipeItem.create({
    data: { menuItemId: dirtyCoffee.id, ingredientId: coffeeBeans.id, quantityRequired: 20 },
  });
  await prisma.recipeItem.create({
    data: { menuItemId: dirtyCoffee.id, ingredientId: freshMilk.id, quantityRequired: 100 },
  });

  const ujiMatchaLatte = await prisma.menuItem.create({
    data: {
      tenantId: tenant1.id,
      categoryId: catNonCoffee.id,
      name: 'Uji Matcha Ceremonial Latte',
      description: 'Stone-ground authentic green tea whisked traditionally with fresh steamed milk.',
      price: 140,
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
      prepTimeMinutes: 5,
      sortOrder: 1,
    },
  });

  await prisma.recipeItem.create({
    data: { menuItemId: ujiMatchaLatte.id, ingredientId: matchaPowder.id, quantityRequired: 6 },
  });
  await prisma.recipeItem.create({
    data: { menuItemId: ujiMatchaLatte.id, ingredientId: freshMilk.id, quantityRequired: 180 },
  });

  const butterCroissant = await prisma.menuItem.create({
    data: {
      tenantId: tenant1.id,
      categoryId: catBakery.id,
      name: 'Golden Butter Croissant',
      description: 'Honeycomb layered croissant made with 100% French AOP Isigny Ste Mère butter.',
      price: 95,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80',
      prepTimeMinutes: 2,
      sortOrder: 1,
    },
  });

  await prisma.recipeItem.create({
    data: { menuItemId: butterCroissant.id, ingredientId: butterCroissantDough.id, quantityRequired: 1 },
  });

  await prisma.menuItem.create({
    data: {
      tenantId: tenant1.id,
      categoryId: catBrunch.id,
      name: 'Truffle Scrambled Eggs on Sourdough',
      description: 'Fluffy organic eggs infused with black truffle paste on toasted artisan sourdough.',
      price: 240,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80',
      prepTimeMinutes: 8,
      sortOrder: 1,
    },
  });

  // 2️⃣ Tenant 2: Sakura Ramen & Izakaya
  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Sakura Ramen & Izakaya',
      slug: 'sakura-ramen',
      logoUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=150&auto=format&fit=crop&q=80',
      currency: 'THB',
      taxRate: 7.0,
      serviceFee: 10.0,
      users: {
        create: [
          {
            name: 'Kenji Master',
            email: 'kenji@sakuraramen.com',
            passwordHash: defaultPassword,
            role: 'OWNER',
            pinCode: '8888',
          },
        ],
      },
    },
  });

  const ramenTables = [
    { tableNumber: 'Counter-1', zone: 'Chef Bar', capacity: 1, qrCodeToken: 'sakura-c01' },
    { tableNumber: 'Counter-2', zone: 'Chef Bar', capacity: 1, qrCodeToken: 'sakura-c02' },
    { tableNumber: 'Booth-1', zone: 'Tatami Room', capacity: 4, qrCodeToken: 'sakura-b01' },
  ];

  for (const t of ramenTables) {
    await prisma.diningTable.create({
      data: {
        tenantId: tenant2.id,
        tableNumber: t.tableNumber,
        zone: t.zone,
        capacity: t.capacity,
        qrCodeToken: t.qrCodeToken,
      },
    });
  }

  const catRamen = await prisma.category.create({
    data: {
      tenantId: tenant2.id,
      name: 'Tonkotsu Ramen',
      icon: '🍜',
      sortOrder: 1,
    },
  });

  await prisma.menuItem.create({
    data: {
      tenantId: tenant2.id,
      categoryId: catRamen.id,
      name: 'Signature Tonkotsu Black Garlic Ramen',
      description: '18-hour rich pork bone broth topped with slow-braised chashu, black garlic oil, and ajitsuke tamago.',
      price: 260,
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80',
      prepTimeMinutes: 10,
    },
  });

  console.log('✅ Seeding completed successfully!');
  console.log(`- Tenant 1: ${tenant1.name} (Slug: ${tenant1.slug})`);
  console.log(`- Tenant 2: ${tenant2.name} (Slug: ${tenant2.slug})`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
