import React, { useEffect, useState, useRef } from "react";
import { Container, Typography, Box, Grid, Alert as MuiAlert, Chip } from "@mui/material";

// ---- SpacetimeDB (unchanged) ----
import { DbConnection } from "./module_bindings";
import { Identity } from "@clockworklabs/spacetimedb-sdk";

// ---- Map styles (safe to keep here if not imported in main.jsx) ----
import "leaflet/dist/leaflet.css";

// ---- Components (pure JSX) ----
import MapView from "./components/MapView";
import TruckList from "./components/TruckList";
import AlertFeed from "./components/AlertFeed";

export default function App() {
  // Existing state
  const [conn, setConn] = useState(null); // DbConnection | null
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState(/** @type {Identity|null} */ (null));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [shipments, setShipments] = useState([]);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // New local UI state (for selecting a truck and toggling alert list)
  const [selectedId, setSelectedId] = useState(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  
  // Map
  const wrapRef = useRef(null);
  const [remountKey, setRemountKey] = useState(0);
  

  // ---------- connect & subscribe (UNCHANGED) ----------
  useEffect(() => {
    const subscribeToQueries = (c, queries) => {
      c?.subscriptionBuilder()
        .onApplied(() => {
          console.log("SDK client cache initialized.");
        })
        .subscribe(queries);
    };

    /** @param {import('./module_bindings').DbConnection} c
        @param {Identity} ident
        @param {string} token */
    const onConnect = (c, ident, token) => {
      setIdentity(ident);
      setConnected(true);
      localStorage.setItem("auth_token", token);
      console.log("Connected with identity:", ident.toHexString());

      subscribeToQueries(c, [
        "SELECT * FROM shipment ORDER BY timestamp DESC",
        "SELECT * FROM sensor_reading ORDER BY timestamp DESC",
        "SELECT * FROM alert ORDER BY timestamp DESC",
      ]);

      // Wire reactive handlers → local React state
      c.db.shipment.onInsert((_ctx, row) => setShipments(prev => [...prev, row]));
      c.db.shipment.onUpdate((_ctx, oldRow, newRow) =>
        setShipments(prev => prev.map(s => (s.id === oldRow.id ? newRow : s))));
      c.db.shipment.onDelete((_ctx, row) =>
        setShipments(prev => prev.filter(s => s.id !== row.id)));

      c.db.sensorReading.onInsert((_ctx, row) =>
        setSensorReadings(prev => [...prev, row]));
      c.db.sensorReading.onDelete((_ctx, row) =>
        setSensorReadings(prev => prev.filter(r => r.id !== row.id)));

      c.db.alert.onInsert((_ctx, row) => setAlerts(prev => [row, ...prev]));
      c.db.alert.onDelete((_ctx, row) => setAlerts(prev => prev.filter(a => a.id !== row.id)));

      console.log("Connected with identity:", ident.toHexString());
    };

    const onDisconnect = () => {
      console.log("Disconnected from SpacetimeDB");
      setConnected(false);
    };

    const onConnectError = (_ctx, err) => {
      console.error("Error connecting to SpacetimeDB:", err);
      setError(err?.message || String(err));
    };

    console.log("THIS SHOULD ONLY HAPPEN ONE TIME");
    const built = DbConnection.builder()
      .withUri("wss://maincloud.spacetimedb.com") // host of your SpacetimeDB node
      .withModuleName("supply-chain")             // name you used in `spacetime publish`
      .withToken(localStorage.getItem("auth_token") || "")
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .onConnectError(onConnectError)
      .build();

    setConn(built);
  }, []);

  // ---------- UI (new layout per your sketch) ----------
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          COLD TRACE
        </Typography>
        <Chip
          label={connected ? "🟢 Connected" : error ? "⚠️ Error" : "🔴 Disconnected"}
          color={connected ? "success" : error ? "warning" : "default"}
          variant="outlined"
        />
      </Box>

      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </MuiAlert>
      )}
      {success && (
        <MuiAlert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </MuiAlert>
      )}

      <Grid container spacing={2} wrap="nowrap">
        {/* MAP (60vw) */}
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

        {/* TRUCK LIST (40vw) */}
        <Grid item sx={{ flex: "0 0 40vw" }}>
          <TruckList
            shipments={shipments}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Grid>
      </Grid>
      {/* ALERT FEED (bottom full-width) */}
        <AlertFeed
          alerts={alerts}
          showAll={showAllAlerts}
          onToggle={setShowAllAlerts}
        />
    </Container>
  );
}
