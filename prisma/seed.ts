import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding facilities...");

  await prisma.facility.deleteMany({});

  const facilitiesPath = path.join(__dirname, "../src/data/facilities.seed.json");
  const facilitiesData = JSON.parse(fs.readFileSync(facilitiesPath, "utf-8"));

  for (const f of facilitiesData) {
    await prisma.facility.create({
      data: {
        name: f.name,
        address: f.address,
        city: f.city, state: f.state,
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

  console.log(`Seeded ${facilitiesData.length} facilities.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
