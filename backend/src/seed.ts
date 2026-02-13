import { eq } from "drizzle-orm";
import { db, organizations, users } from "./db";
import { hashPassword } from "./lib/password";

async function seed() {
  console.log("🌱 Seeding database...");

  // 1. Create or get Organizations
  console.log("Creating organizations...");

  const orgData = [
    { name: "UCH Pusat", slug: "uch", isCenter: true },
    { name: "University Software House", slug: "ush", isCenter: false },
    { name: "Fastlab", slug: "fastlab", isCenter: false },
    { name: "Sentra HKI", slug: "hki", isCenter: false },
    { name: "PKM Center", slug: "pkm", isCenter: false },
  ];

  const orgs: typeof organizations.$inferSelect[] = [];

  for (const org of orgData) {
    // Check if exists
    const [existing] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, org.slug))
      .limit(1);

    if (existing) {
      console.log(`  - Organization "${org.name}" already exists, skipping...`);
      orgs.push(existing);
    } else {
      const [created] = await db
        .insert(organizations)
        .values(org)
        .returning();
      console.log(`  - Created organization "${org.name}"`);
      orgs.push(created);
    }
  }

  console.log(`✅ ${orgs.length} organizations ready`);

  // 2. Create Users
  console.log("\nCreating users...");

  const uchOrg = orgs.find((o) => o.slug === "uch")!;
  const ushOrg = orgs.find((o) => o.slug === "ush")!;
  const fastlabOrg = orgs.find((o) => o.slug === "fastlab")!;
  const hkiOrg = orgs.find((o) => o.slug === "hki")!;
  const pkmOrg = orgs.find((o) => o.slug === "pkm")!;

  const defaultPassword = await hashPassword("password123");

  const userData = [
    // UCH Super Admin
    {
      name: "Super Admin UCH",
      email: "admin@uch.ac.id",
      passwordHash: defaultPassword,
      role: "SUPER_ADMIN" as const,
      organizationId: uchOrg.id,
    },
    // USH
    {
      name: "Admin USH",
      email: "admin@ush.ac.id",
      passwordHash: defaultPassword,
      role: "ADMIN_LINI" as const,
      organizationId: ushOrg.id,
    },
    {
      name: "Staff USH",
      email: "staff@ush.ac.id",
      passwordHash: defaultPassword,
      role: "STAFF" as const,
      organizationId: ushOrg.id,
    },
    // Fastlab
    {
      name: "Admin Fastlab",
      email: "admin@fastlab.ac.id",
      passwordHash: defaultPassword,
      role: "ADMIN_LINI" as const,
      organizationId: fastlabOrg.id,
    },
    {
      name: "Staff Fastlab",
      email: "staff@fastlab.ac.id",
      passwordHash: defaultPassword,
      role: "STAFF" as const,
      organizationId: fastlabOrg.id,
    },
    // HKI
    {
      name: "Admin HKI",
      email: "admin@hki.ac.id",
      passwordHash: defaultPassword,
      role: "ADMIN_LINI" as const,
      organizationId: hkiOrg.id,
    },
    // PKM Center
    {
      name: "Admin PKM",
      email: "admin@pkm.ac.id",
      passwordHash: defaultPassword,
      role: "ADMIN_LINI" as const,
      organizationId: pkmOrg.id,
    },
  ];

  let usersCreated = 0;
  for (const user of userData) {
    // Check if exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email))
      .limit(1);

    if (existing) {
      console.log(`  - User "${user.email}" already exists, skipping...`);
    } else {
      await db.insert(users).values(user);
      console.log(`  - Created user "${user.email}" (${user.role})`);
      usersCreated++;
    }
  }

  console.log(`✅ ${usersCreated} users created`);

  // 3. Create Dummy Financial Logs (INCOME)
  console.log("\nCreating dummy financial logs...");
  
  // Get Super Admin User
  const [superAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@uch.ac.id"))
    .limit(1);

  if (superAdmin) {
      // Import schema tables locally if needed or assume access via db helpers if configured, 
      // but easier to import from ./db
      const { financialLogs, logItems } = await import("./db");

      // Create Income Log 1
      const [incomeLog1] = await db.insert(financialLogs).values({
          type: "INCOME",
          totalAmount: "15000000",
          description: "Project Pembuatan Website Company Profile",
          organizationId: superAdmin.organizationId,
          userId: superAdmin.id,
          transactionDate: new Date(),
      }).returning();
      
      // Create Log Items for Log 1
      const items1 = [
          {
              logId: incomeLog1.id,
              itemName: "Jasa Development Website",
              quantity: "1",
              unitPrice: "10000000",
              subTotal: "10000000"
          },
          {
              logId: incomeLog1.id,
              itemName: "Maintenance Server (1 Tahun)",
              quantity: "1",
              unitPrice: "5000000",
              subTotal: "5000000"
          }
      ];
      for (const item of items1) {
          await db.insert(logItems).values(item);
      }

      // Create Income Log 2
      const [incomeLog2] = await db.insert(financialLogs).values({
        type: "INCOME",
        totalAmount: "7500000",
        description: "Project Mobile App Maintenance",
        organizationId: superAdmin.organizationId,
        userId: superAdmin.id,
        transactionDate: new Date(),
    }).returning();
    
    // Create Log Items for Log 2
    const items2 = [
        {
            logId: incomeLog2.id,
            itemName: "Bug Fixing & Optimization",
            quantity: "1",
            unitPrice: "5000000",
            subTotal: "5000000"
        },
        {
            logId: incomeLog2.id,
            itemName: "Server Upgrade",
            quantity: "1",
            unitPrice: "2500000",
            subTotal: "2500000"
        }
    ];
    for (const item of items2) {
        await db.insert(logItems).values(item);
    }
      
      console.log("  - Created Dummy Income Logs with Items");
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Login credentials (password: password123):");
  console.log("  - Super Admin: admin@uch.ac.id");
  console.log("  - Admin USH: admin@ush.ac.id");
  console.log("  - Staff USH: staff@ush.ac.id");
  console.log("  - Admin Fastlab: admin@fastlab.ac.id");
  console.log("  - Staff Fastlab: staff@fastlab.ac.id");
  console.log("  - Admin HKI: admin@hki.ac.id");
  console.log("  - Admin PKM: admin@pkm.ac.id");

  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
