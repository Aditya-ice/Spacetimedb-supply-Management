import { DbConnection } from "@clockworklabs/spacetimedb-sdk";

function now() {
  return Math.floor(Date.now() / 1000); // unix seconds
}

async function run() {
  const conn = await DbConnection.connect({
    uri: "wss://maincloud.spacetimedb.com",
    module: "simulator",  // must match spacetime publish
  });

  // Insert 2 demo trucks if not already there
  await conn.call("create_shipment", [
    1, "Truck 1", "In Transit", 2.0, 8.0, "40.7128,-74.0060", now(),
  ]).catch(() => {});
  await conn.call("create_shipment", [
    2, "Truck 2", "Idle", 0.0, 10.0, "34.0522,-118.2437", now(),
  ]).catch(() => {});

  console.log("Truck simulation running...");

  setInterval(async () => {
    const jitter = () => (Math.random() - 0.5) * 0.05;

    // Move Truck 1 around NYC
    const lat1 = 40.7128 + jitter();
    const lon1 = -74.0060 + jitter();
    await conn.call("update_shipment_location", [
      1,
      `${lat1},${lon1}`,
      now(),
    ]);

    // Move Truck 2 around LA
    const lat2 = 34.0522 + jitter();
    const lon2 = -118.2437 + jitter();
    await conn.call("update_shipment_location", [
      2,
      `${lat2},${lon2}`,
      now(),
    ]);

    // Simulate temperature readings
    const temp1 = 2 + Math.random() * 10;
    await conn.call("process_sensor_reading", [1, now(), temp1]);
    const temp2 = 1 + Math.random() * 9;
    await conn.call("process_sensor_reading", [2, now(), temp2]);

    console.log("Updated trucks + temps");
  }, 5000);
}

run().catch(console.error);
