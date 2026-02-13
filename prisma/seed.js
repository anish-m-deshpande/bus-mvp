// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding facilities (JS)...");

  try {
     // Correct syntax for Prisma Client method calls
     await prisma.facility.deleteMany();
  } catch (error) {
    console.log("Could not clear existing facilities:", error.message);
  }

  const facilitiesPath = path.join(__dirname, "../src/data/facilities.seed.json");
  const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, "utf-8"));

  for (const f of facilitiesData) {
    await prisma.facility.create({
      data: {
        name: f.name,
        address: f.address,
        city: f.city,
        state: f.state,
        zip: f.zip,
        lat: f.lat,
        lon: f.lon,
        coverage_states: JSON.stringify(f.coverage_states),
        capabilities: JSON.stringify(f.capabilities),
        hours: f.hours,
        contact_email: f.contact_email,
      },
    });
  }

  console.log(`Successfully seeded ${facilitiesData.length} facilities.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
