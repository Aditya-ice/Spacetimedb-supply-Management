import { Timestamp } from "@clockworklabs/spacetimedb-sdk";

export async function seedDemoData(conn) {
  if (!conn) return;

  try {
    console.log("🌱 Seeding demo data...");

    const now = Timestamp.fromDate(new Date());

    await conn.reducers.createShipment(
      1,
      "Vaccines",
      "in transit",
      2,
      8,
      { latitude: 40.7128, longitude: -74.0060 },   // New York
      { latitude: 39.9526, longitude: -75.1652 },   // Philadelphia
      { latitude: 39.2904, longitude: -76.6122 },   // Baltimore
      "Pfizer",
      "Johns Hopkins",
      now
    );

    await conn.reducers.createShipment(
      2,
      "Fresh Produce",
      "processing",
      0,
      5,
      { latitude: 42.3601, longitude: -71.0589 },   // Boston
      { latitude: 41.7658, longitude: -72.6734 },   // Hartford
      { latitude: 41.3083, longitude: -72.9279 },   // New Haven
      "Whole Foods",
      "Trader Joe's",
      now
    );

    await conn.reducers.processSensorReading(
      1,
      now,
      6
    );

    console.log("✅ Demo data seeded!");
  } catch (err) {
    console.error("❌ Error seeding demo data:", err);
  }
}
