import React, { useEffect, useState, useRef } from "react";
import { Container, Typography, Box, Grid, Alert as MuiAlert, Chip, Button } from "@mui/material";
import { DbConnection } from "./module_bindings";
import { Identity } from "@clockworklabs/spacetimedb-sdk";
import "leaflet/dist/leaflet.css";
import MapView from "./components/MapView";
import TruckList from "./components/TruckList";
import DriverList from "./components/DriverList";
import AlertFeed from "./components/AlertFeed";

export default function App() {
  const [conn, setConn] = useState(null);
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [remountKey, setRemountKey] = useState(0);

  useEffect(() => {
    const onConnect = (c, ident, token) => {
      setIdentity(ident);
      setConnected(true);
      localStorage.setItem("auth_token", token);
      c.subscribe(["SELECT * FROM shipment", "SELECT * FROM sensor_reading", "SELECT * FROM alert", "SELECT * FROM driver"]);
      c.db.shipment.onInsert((_ctx, row) => setShipments(prev => [...prev, row]));
      c.db.shipment.onUpdate((_ctx, oldRow, newRow) => setShipments(prev => prev.map(s => (s.id === oldRow.id ? newRow : s))));
      c.db.shipment.onDelete((_ctx, row) => setShipments(prev => prev.filter(s => s.id !== row.id)));
      c.db.sensorReading.onInsert((_ctx, row) => setSensorReadings(prev => [...prev, row]));
      c.db.sensorReading.onDelete((_ctx, row) => setSensorReadings(prev => prev.filter(r => r.id !== row.id)));
      c.db.alert.onInsert((_ctx, row) => setAlerts(prev => [row, ...prev]));
      c.db.alert.onDelete((_ctx, row) => setAlerts(prev => prev.filter(a => a.id !== row.id)));
      c.db.driver.onInsert((_ctx, row) => setDrivers(prev => [...prev, row]));
      c.db.driver.onUpdate((_ctx, oldRow, newRow) => setDrivers(prev => prev.map(d => (d.id === oldRow.id ? newRow : d))));
      c.db.driver.onDelete((_ctx, row) => setDrivers(prev => prev.filter(d => d.id !== row.id)));
    };
    const built = DbConnection.builder()
      .withUri("wss://maincloud.spacetimedb.com")
      .withModuleName("hophacks-sxt-supply")
      .withToken(localStorage.getItem("auth_token") || "")
      .onConnect(onConnect)
      .onDisconnect(() => setConnected(false))
      .onConnectError((_ctx, err) => setError(err?.message || String(err)))
      .build();
    setConn(built);
  }, []);

  // Corrected Shipment Handler
  const handleCreateShipment = async (shipmentData) => {
    try {
      if (!conn) throw new Error("Not connected");
      await conn.reducers.createShipment(
        BigInt(shipmentData.id),
        String(shipmentData.content),
        String(shipmentData.status), // Added status
        parseFloat(shipmentData.min_temp),
        parseFloat(shipmentData.max_temp),
        // Added current_location (same as start_location for new shipments)
        { latitude: parseFloat(shipmentData.start_lat), longitude: parseFloat(shipmentData.start_lng) },
        { latitude: parseFloat(shipmentData.start_lat), longitude: parseFloat(shipmentData.start_lng) },
        { latitude: parseFloat(shipmentData.end_lat), longitude: parseFloat(shipmentData.end_lng) },
        String(shipmentData.sender_information),
        String(shipmentData.receiver_information)
      );
      setSuccess("Shipment created successfully!");
    } catch (e) {
      console.error("❌ Error creating shipment:", e);
      setError(e.message || String(e));
    }
  };

  // Corrected Driver Handler
  const handleCreateDriver = async (driverData) => {
    try {
      if (!conn) throw new Error("Not connected");
      await conn.reducers.createDriver(
        driverData.id, // This is now a pre-validated BigInt from DriverList
        driverData.status,
        { latitude: driverData.current_lat, longitude: driverData.current_lng },
        BigInt(Date.now() * 1000)
      );
      setSuccess("Driver created successfully!");
    } catch (e) {
      console.error("❌ Error creating driver:", e);
      setError(e.message || String(e));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>COLD TRACE</Typography>
        <Chip label={connected ? "🟢 Connected" : "🔴 Disconnected"} color={connected ? "success" : "default"} />
      </Box>
      {error && <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</MuiAlert>}
      {success && <MuiAlert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</MuiAlert>}
      <Grid container spacing={2} wrap="nowrap">
        <Grid item sx={{ flex: "0 0 60%" }}>
          <Box sx={{ height: "70vh", minHeight: 350, borderRadius: 1, overflow: "hidden", border: "1px solid #e0e0e0" }}>
            <MapView key={remountKey} shipments={shipments} selectedId={selectedId} onSelect={setSelectedId} />
          </Box>
        </Grid>
        <Grid item sx={{ flex: "0 0 34vw" }}>
          <Box sx={{ height: "70vh", minHeight: 350, display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: "0 0 50%", border: "1px solid #e0e0e0", borderRadius: 1, mb: 1 }}>
              <TruckList shipments={shipments} selectedId={selectedId} onSelect={setSelectedId} onCreateShipment={handleCreateShipment} />
            </Box>
            <Box sx={{ flex: "0 0 50%", border: "1px solid #e0e0e0", borderRadius: 1, mt: 1 }}>
              <DriverList drivers={drivers} selectedId={selectedDriverId} onSelect={setSelectedDriverId} onCreateDriver={handleCreateDriver} />
            </Box>
          </Box>
        </Grid>
      </Grid>
      <AlertFeed alerts={alerts} showAll={showAllAlerts} onToggle={setShowAllAlerts} />
    </Container>
  );
}