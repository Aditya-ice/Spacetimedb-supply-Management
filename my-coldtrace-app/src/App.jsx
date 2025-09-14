import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Alert as MuiAlert,
  Chip,
} from "@mui/material";

// ---- SpacetimeDB ----
import { DbConnection } from "./module_bindings";
import { Identity } from "@clockworklabs/spacetimedb-sdk";

// ---- Map styles ----
import "leaflet/dist/leaflet.css";

// ---- Components ----
import MapView from "./components/MapView";
import TruckList from "./components/TruckList";
import AlertFeed from "./components/AlertFeed";

export default function App() {
  const [conn, setConn] = useState(null);
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState(/** @type {Identity|null} */ (null));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [shipments, setShipments] = useState([]);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const wrapRef = useRef(null);
  const [remountKey, setRemountKey] = useState(0);

  // ---------- connect & subscribe ----------
  useEffect(() => {
    const subscribeToQueries = (c, queries) => {
      c?.subscriptionBuilder()
        .onApplied(() => {
          console.log("SDK client cache initialized.");
        })
        .subscribe(queries);
    };

    const onConnect = (c, ident, token) => {
      setIdentity(ident);
      setConnected(true);

      if (token) {
        localStorage.setItem("auth_token", token);
      }

      console.log("✅ Connected with identity:", ident.toHexString());
      console.log("Token being used:", token);

      subscribeToQueries(c, [
        "SELECT * FROM shipment ORDER BY timestamp DESC",
        "SELECT * FROM sensor_reading ORDER BY timestamp DESC",
        "SELECT * FROM alert ORDER BY timestamp DESC",
      ]);

      c.db.shipment.onInsert((_ctx, row) =>
        setShipments((prev) => [...prev, row])
      );
      c.db.shipment.onUpdate((_ctx, oldRow, newRow) =>
        setShipments((prev) =>
          prev.map((s) => (s.id === oldRow.id ? newRow : s))
        )
      );
      c.db.shipment.onDelete((_ctx, row) =>
        setShipments((prev) => prev.filter((s) => s.id !== row.id))
      );

      c.db.sensorReading.onInsert((_ctx, row) =>
        setSensorReadings((prev) => [...prev, row])
      );
      c.db.sensorReading.onDelete((_ctx, row) =>
        setSensorReadings((prev) => prev.filter((r) => r.id !== row.id))
      );

      c.db.alert.onInsert((_ctx, row) => setAlerts((prev) => [row, ...prev]));
      c.db.alert.onDelete((_ctx, row) =>
        setAlerts((prev) => prev.filter((a) => a.id !== row.id))
      );
    };

    const onDisconnect = () => {
      console.log("⚠️ Disconnected from SpacetimeDB");
      setConnected(false);
    };

    const onConnectError = (_ctx, err) => {
      console.error("❌ Error connecting to SpacetimeDB:", err);
      setError(err?.message || String(err));
    };

    console.log("THIS SHOULD ONLY HAPPEN ONE TIME");

    const token = localStorage.getItem("auth_token") || "";
    console.log(
      "🔗 Connecting with settings:",
      "uri=wss://maincloud.spacetimedb.com",
      "module=simulator",
      "token=" + (token || "(empty)")
    );


    const built = DbConnection.builder()
      .withUri("wss://maincloud.spacetimedb.com")
      .withModuleName("simulator")
      .withToken(token) // "" = fresh token
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .onConnectError(onConnectError)
      .build();

    setConn(built);
  }, []);

  // ---------- UI ----------
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          COLD TRACE
        </Typography>
        <Chip
          label={
            connected ? "🟢 Connected" : error ? "⚠️ Error" : "🔴 Disconnected"
          }
          color={connected ? "success" : error ? "warning" : "default"}
          variant="outlined"
        />
      </Box>

      {error && (
        <MuiAlert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </MuiAlert>
      )}
      {success && (
        <MuiAlert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </MuiAlert>
      )}

      <Grid container spacing={2} wrap="nowrap">
        {/* MAP */}
        <Grid item sx={{ flex: "0 0 60vw" }}>
          <Box
            sx={{
              height: "75vh",
              minHeight: 400,
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "#f6f6f6",
              border: "1px solid #e0e0e0",
            }}
          >
            <MapView
              key={remountKey}
              shipments={shipments}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </Box>
        </Grid>

        {/* TRUCK LIST */}
        <Grid item sx={{ flex: "0 0 40vw" }}>
          <TruckList
            shipments={shipments}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Grid>
      </Grid>

      {/* ALERT FEED */}
      <AlertFeed
        alerts={alerts}
        showAll={showAllAlerts}
        onToggle={setShowAllAlerts}
      />
    </Container>
  );
}
