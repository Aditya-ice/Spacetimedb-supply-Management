import React, { useEffect, useState } from "react";
import {
  Container, Typography, Box, Paper, Grid, Button, TextField,
  Alert as MuiAlert, Chip, Card, CardContent, CardActions,
  List, ListItem, ListItemText
} from "@mui/material";

// Import the generated DbConnection and table/reducer types
import { DbConnection } from "./module_bindings";
import { Identity, Timestamp } from "@clockworklabs/spacetimedb-sdk";

const STATUS_OPTIONS = ["Processing", "In Transit", "Delayed", "Delivered"];

export default function App() {
  const [conn, setConn] = useState(null);              // DbConnection | null
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState(/** @type {Identity|null} */(null));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [shipments, setShipments] = useState([]);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);

  console.log(conn);

  const [newShipment, setNewShipment] = useState({
    id: "",
    content: "",
    min_temp: "",
    max_temp: "",
    start_lat: "",
    start_lng: "",
    end_lat: "",
    end_lng: "",
    sender_information: "",
    receiver_information: "",
  });

  const [newReading, setNewReading] = useState({ shipmentId: "", temperature: "" });

  // ---------- connect & subscribe ----------
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

      c.db.alert.onInsert((_ctx, row) => setAlerts(prev => [...prev, row]));
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
      .withUri("wss://maincloud.spacetimedb.com")            // host of your SpacetimeDB node
      .withModuleName("hophacks-sxt")            // name you used in `spacetime publish`
      .withToken(localStorage.getItem("auth_token") || "")
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .onConnectError(onConnectError)
      .build();

    setConn(built);
  }, []);

  // ---------- action handlers via generated reducers ----------
  const handleCreateShipment = async () => {
    try {
      if (!conn) throw new Error("Not connected");

      await conn.reducers.createShipment(
        Number(newShipment.id),
        String(newShipment.content),
        parseFloat(newShipment.min_temp),
        parseFloat(newShipment.max_temp),
        {
          latitude: parseFloat(newShipment.start_lat),
          longitude: parseFloat(newShipment.start_lng)
        },
        {
          latitude: parseFloat(newShipment.end_lat),
          longitude: parseFloat(newShipment.end_lng)
        },
        String(newShipment.sender_information),
        String(newShipment.receiver_information),
      );

      setSuccess("Shipment created!");
      setNewShipment({
        id: "", content: "", min_temp: "", max_temp: "",
        start_lat: "", start_lng: "", end_lat: "", end_lng: "",
        sender_information: "", receiver_information: ""
      });
    } catch (e) {
      console.error(e)
      setError(e.message || String(e));
    }
  };

  const handleProcessReading = async () => {
    try {
      if (!conn) throw new Error("Not connected");
      const ts = Math.floor(Date.now() / 1000);
      await conn.reducers.processSensorReading(
        Number(newReading.shipmentId),
        Timestamp.fromDate(new Date(ts * 1000)),
        parseFloat(newReading.temperature),
      );
      setSuccess("Sensor reading processed.");
      setNewReading({ shipmentId: "", temperature: "" });
    }
    catch (e) {
      console.error(e)
      setError(e.message || String(e));
    }
  };

  const handleGetStatus = async (shipmentId) => {
    // This function is not implemented in the backend yet
    setSuccess(`Shipment ${shipmentId} status: Available in database`);
  };

  // ---------- UI ----------
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" align="center">🚚 ColdTrace — Live</Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
          <Chip
            label={connected ? "🟢 Connected" : "🔴 Disconnected"}
            color={connected ? "success" : "error"}
            variant="outlined"
          />
        </Box>
      </Box>

      {error && <MuiAlert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</MuiAlert>}
      {success && <MuiAlert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</MuiAlert>}

      <Grid container spacing={3}>
        {/* Create Shipment */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>📦 Create Shipment</Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <TextField label="ID" type="number" value={newShipment.id}
                onChange={e => setNewShipment(s => ({ ...s, id: e.target.value }))} />
              <TextField label="Content" value={newShipment.content}
                onChange={e => setNewShipment(s => ({ ...s, content: e.target.value }))} />
              <TextField label="Min Temp (°C)" type="number" value={newShipment.min_temp}
                onChange={e => setNewShipment(s => ({ ...s, min_temp: e.target.value }))} />
              <TextField label="Max Temp (°C)" type="number" value={newShipment.max_temp}
                onChange={e => setNewShipment(s => ({ ...s, max_temp: e.target.value }))} />
              <TextField label="Start Latitude" type="number" step="0.000001" value={newShipment.start_lat}
                onChange={e => setNewShipment(s => ({ ...s, start_lat: e.target.value }))} />
              <TextField label="Start Longitude" type="number" step="0.000001" value={newShipment.start_lng}
                onChange={e => setNewShipment(s => ({ ...s, start_lng: e.target.value }))} />
              <TextField label="End Latitude" type="number" step="0.000001" value={newShipment.end_lat}
                onChange={e => setNewShipment(s => ({ ...s, end_lat: e.target.value }))} />
              <TextField label="End Longitude" type="number" step="0.000001" value={newShipment.end_lng}
                onChange={e => setNewShipment(s => ({ ...s, end_lng: e.target.value }))} />
              <TextField label="Sender Info" value={newShipment.sender_information}
                onChange={e => setNewShipment(s => ({ ...s, sender_information: e.target.value }))} />
              <TextField label="Receiver Info" value={newShipment.receiver_information}
                onChange={e => setNewShipment(s => ({ ...s, receiver_information: e.target.value }))} />
              <Button variant="contained" onClick={handleCreateShipment} disabled={!connected}>Create</Button>
            </Box>
          </Paper>
        </Grid>

        {/* Process Reading */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>🌡️ Add Sensor Reading</Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <TextField label="Shipment ID" type="number" value={newReading.shipmentId}
                onChange={e => setNewReading(r => ({ ...r, shipmentId: e.target.value }))} />
              <TextField label="Temperature (°C)" type="number" value={newReading.temperature}
                onChange={e => setNewReading(r => ({ ...r, temperature: e.target.value }))} />
              <Button variant="contained" onClick={handleProcessReading} disabled={!connected}>Add Reading</Button>
            </Box>
          </Paper>
        </Grid>

        {/* Shipments */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>📦 Shipments ({shipments.length})</Typography>
            <List>
              {shipments.map(s => (
                <Card key={s.id} sx={{ mb: 1 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="subtitle1"><b>{s.content}</b> (ID {s.id})</Typography>
                    <Typography variant="body2" color="text.secondary">Status: {s.status}</Typography>
                    <Typography variant="body2" color="text.secondary">Range: {s.min_temp}–{s.max_temp} °C</Typography>
                    <Typography variant="body2" color="text.secondary">Current temp: {s.current_temp ?? "—"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start: ({s.start_location?.latitude}, {s.start_location?.longitude}) →
                      Current: ({s.current_location?.latitude || "—"}, {s.current_location?.longitude || "—"}) →
                      End: ({s.end_location?.latitude}, {s.end_location?.longitude})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Sender: {s.sender_information}</Typography>
                    <Typography variant="body2" color="text.secondary">Receiver: {s.receiver_information}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Updated: {new Date(Number(s.timestamp))?.toLocaleString?.() ?? ""}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleGetStatus(s.id)}>Get Status</Button>
                  </CardActions>
                </Card>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Readings */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>🌡️ Readings ({sensorReadings.length})</Typography>
            <List>
              {sensorReadings.slice(-10).reverse().map(r => (
                <ListItem key={r.id} divider>
                  <ListItemText
                    primary={`Shipment ${r.shipment_id}: ${r.temperature}°C`}
                    secondary={new Date(Number(r.timestamp)).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>🚨 Alerts ({alerts.length})</Typography>
            <List>
              {alerts.slice(-10).reverse().map(a => (
                <ListItem key={a.id} divider>
                  <ListItemText
                    primary={a.message}
                    secondary={`Shipment ${a.shipment_id} — ${new Date(Number(a.timestamp)).toLocaleString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
