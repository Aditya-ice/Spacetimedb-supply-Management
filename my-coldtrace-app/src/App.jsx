import { useEffect, useState } from "react";
import { connect, SqlSubscribe } from "@clockworklabs/spacetimedb-sdk";

export default function App() {
  const [shipments, setShipments] = useState([]);

  useEffect(() => {
    let sub, db;

    (async () => {
      // Replace with your actual SpacetimeDB instance URL and module name
      db = await connect({ url: "wss://localhost:3000/supply-chain" });

      sub = await db.subscribe(SqlSubscribe`
        SELECT id, name, status, min_temp, max_temp
        FROM Shipment
      `);

      sub.on("update", (delta) => {
        setShipments([...delta.current]);
      });
    })();

    return () => sub?.unsubscribe?.();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>ColdTrace Shipments</h1>
      <ul>
        {shipments.map((s) => (
          <li key={s.id}>
            <b>{s.name}</b> – {s.status} ({s.min_temp}–{s.max_temp}°C)
          </li>
        ))}
      </ul>
    </div>
  );
}
