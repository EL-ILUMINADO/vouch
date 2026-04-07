import { db } from "@/db";
import { users } from "@/db/schema";
import { faker } from "@faker-js/faker";
import {
  SUPPORTED_UNIVERSITIES,
  RADAR_MIN_KM,
  RADAR_MAX_KM,
  RADAR_MAX_SIGNALS,
} from "@/lib/constants/universities";

async function seedRadarUsers() {
  const uni = SUPPORTED_UNIVERSITIES.find((u) => u.id === "uniben");
  if (!uni)
    throw new Error("UNIBEN config not found in SUPPORTED_UNIVERSITIES");

  const { lat: CENTER_LAT, lng: CENTER_LNG } = uni.coordinates;
  console.log(
    `📡 Seeding ${RADAR_MAX_SIGNALS} signals around ${uni.name} (${CENTER_LAT}, ${CENTER_LNG})…`,
  );

  const faculties = [
    "Engineering",
    "Life Sciences",
    "Arts",
    "Law",
    "Social Sciences",
    "Medicine",
  ];

  const newUsers = [];

  for (let i = 0; i < RADAR_MAX_SIGNALS; i++) {
    // Distribute uniformly within the radar ring (RADAR_MIN_KM → RADAR_MAX_KM)
    // so seeded users actually appear on the radar display.
    const distance =
      Math.random() * (RADAR_MAX_KM - RADAR_MIN_KM) + RADAR_MIN_KM;
    const angle = Math.random() * Math.PI * 2;

    // Convert km offset to degree offset.
    // 1 degree latitude ≈ 111 km everywhere.
    // 1 degree longitude ≈ 111 * cos(lat) km.
    const latOffset = (distance * Math.sin(angle)) / 111;
    const lngOffset =
      (distance * Math.cos(angle)) /
      (111 * Math.cos((CENTER_LAT * Math.PI) / 180));

    newUsers.push({
      id: crypto.randomUUID(),
      name: faker.person.firstName(),
      email: faker.internet.email().toLowerCase(),
      // Must match the `id` field in SUPPORTED_UNIVERSITIES, not the display name.
      university: "uniben",
      department: faker.helpers.arrayElement(faculties),
      level: faker.helpers.arrayElement([
        "100L",
        "200L",
        "300L",
        "400L",
        "500L",
      ]),
      verificationStatus: "verified" as const,
      latitude: CENTER_LAT + latOffset,
      longitude: CENTER_LNG + lngOffset,
      radarPings: 10,
    });
  }

  await db.insert(users).values(newUsers);
  console.log(
    `✅ Planted ${newUsers.length} signals within ${RADAR_MIN_KM}–${RADAR_MAX_KM}km of ${uni.name}.`,
  );
}

seedRadarUsers().catch(console.error);
