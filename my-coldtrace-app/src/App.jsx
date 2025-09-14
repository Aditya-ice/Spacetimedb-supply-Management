import React, { useEffect, useState, useRef } from "react";
import { Container, Typography, Box, Grid, Alert as MuiAlert, Chip, Button } from "@mui/material";

// ---- SpacetimeDB (unchanged) ----
import { DbConnection } from "./module_bindings";
import { Identity } from "@clockworklabs/spacetimedb-sdk";

// ---- Map styles (safe to keep here if not imported in main.jsx) ----
import "leaflet/dist/leaflet.css";

// ---- Components (pure JSX) ----
import MapView from "./components/MapView";
import TruckList from "./components/TruckList";
import DriverList from "./components/DriverList";
import AlertFeed from "./components/AlertFeed";

export default function App() {
  // Existing state
  const [conn, setConn] = useState(null); // DbConnection | null
  const [connected, setConnected] = useState(false);
  const [identity, setIdentity] = useState(/** @type {Identity|null} */(null));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [shipments, setShipments] = useState([]);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Debug shipments state changes
  useEffect(() => {
    console.log("Shipments state changed:", shipments.length, shipments);
  }, [shipments]);

  // Debug drivers state changes
  useEffect(() => {
    console.log("Drivers state changed:", drivers.length, drivers);
  }, [drivers]);

  // New local UI state (for selecting a truck and toggling alert list)
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
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
          
          // Load initial data after subscription is applied
          console.log("🔍 Attempting to load initial data...");
          console.log("🔍 Available tables:", Object.keys(c.db));
          console.log("🔍 Table types:", {
            shipment: typeof c.db.shipment,
            driver: typeof c.db.driver,
            alert: typeof c.db.alert,
            sensorReading: typeof c.db.sensorReading
          });
          
          try {
            console.log("🔍 Loading shipments...");
            const initialShipments = c.db.shipment.iter().collect();
            console.log("🔍 Loading sensor readings...");
            const initialSensorReadings = c.db.sensorReading.iter().collect();
            console.log("🔍 Loading alerts...");
            const initialAlerts = c.db.alert.iter().collect();
            console.log("🔍 Loading drivers...");
            const initialDrivers = c.db.driver.iter().collect();
            
            console.log("✅ Initial data loaded after subscription:", {
              shipments: initialShipments.length,
              sensorReadings: initialSensorReadings.length,
              alerts: initialAlerts.length,
              drivers: initialDrivers.length,
              shipmentData: initialShipments,
              driverData: initialDrivers
            });
            
            setShipments(initialShipments);
            setSensorReadings(initialSensorReadings);
            setAlerts(initialAlerts);
            setDrivers(initialDrivers);
          } catch (error) {
            console.error("❌ Error loading initial data:", error);
          }
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
      console.log("✅ Connected with identity:", ident.toHexString());
      console.log("🔗 Connection object:", c);
      console.log("🗄️ Database tables available:", Object.keys(c.db));
      console.log("🔍 Checking individual table access:");
      console.log("  - c.db.shipment:", typeof c.db.shipment, c.db.shipment);
      console.log("  - c.db.driver:", typeof c.db.driver, c.db.driver);
      console.log("  - c.db.alert:", typeof c.db.alert, c.db.alert);
      console.log("  - c.db.sensorReading:", typeof c.db.sensorReading, c.db.sensorReading);

      subscribeToQueries(c, [
        "SELECT * FROM shipment ORDER BY timestamp DESC",
        "SELECT * FROM sensor_reading ORDER BY timestamp DESC",
        "SELECT * FROM alert ORDER BY timestamp DESC",
        "SELECT * FROM driver ORDER BY timestamp DESC",
      ]);

      // Wire reactive handlers → local React state
      c.db.shipment.onInsert((_ctx, row) => {
        console.log("🚚 New shipment inserted:", row);
        console.log("🚚 Current shipments before insert:", shipments.length);
        setShipments(prev => {
          const newShipments = [...prev, row];
          console.log("🚚 New shipments array:", newShipments.length, newShipments);
          return newShipments;
        });
      });
      c.db.shipment.onUpdate((_ctx, oldRow, newRow) => {
        console.log("🔄 Shipment updated:", oldRow.id, "->", newRow);
        setShipments(prev => prev.map(s => (s.id === oldRow.id ? newRow : s)));
      });
      c.db.shipment.onDelete((_ctx, row) => {
        console.log("🗑️ Shipment deleted:", row.id);
        setShipments(prev => prev.filter(s => s.id !== row.id));
      });

      c.db.sensorReading.onInsert((_ctx, row) => {
        console.log("New sensor reading inserted:", row);
        setSensorReadings(prev => [...prev, row]);
      });
      c.db.sensorReading.onDelete((_ctx, row) => {
        console.log("Sensor reading deleted:", row.id);
        setSensorReadings(prev => prev.filter(r => r.id !== row.id));
      });

      c.db.alert.onInsert((_ctx, row) => {
        console.log("New alert inserted:", row);
        setAlerts(prev => [row, ...prev]);
      });
      c.db.alert.onDelete((_ctx, row) => {
        console.log("Alert deleted:", row.id);
        setAlerts(prev => prev.filter(a => a.id !== row.id));
      });

      c.db.driver.onInsert((_ctx, row) => {
        console.log("🚛 New driver inserted:", row);
        setDrivers(prev => [...prev, row]);
      });
      c.db.driver.onUpdate((_ctx, oldRow, newRow) => {
        console.log("🔄 Driver updated:", oldRow.id, "->", newRow);
        setDrivers(prev => prev.map(d => (d.id === oldRow.id ? newRow : d)));
      });
      c.db.driver.onDelete((_ctx, row) => {
        console.log("🗑️ Driver deleted:", row.id);
        setDrivers(prev => prev.filter(d => d.id !== row.id));
      });

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
    const authToken = localStorage.getItem("auth_token");
    console.log("🔐 Auth token from localStorage:", authToken ? "Present" : "Missing");
    console.log("🌐 Connecting to SpacetimeDB...");
    console.log("📦 Module name: hophacks-sxt-supply");
    console.log("🌐 Server URI: wss://maincloud.spacetimedb.com");
    
    const built = DbConnection.builder()
      .withUri("wss://maincloud.spacetimedb.com") // host of your SpacetimeDB node
      .withModuleName("hophacks-sxt-supply")             // name you used in `spacetime publish`
      .withToken(authToken || "")
      .onConnect(onConnect)
      .onDisconnect(onDisconnect)
      .onConnectError(onConnectError)
      .build();

    setConn(built);
  }, []);

  // ---------- Shipment creation handler ----------
  const handleCreateShipment = async (shipmentData) => {
    try {
      if (!conn) throw new Error("Not connected");

      console.log("🚀 Creating shipment with data:", shipmentData);
      console.log("🚀 Current shipments before creation:", shipments.length);

      await conn.reducers.createShipment(
        Number(shipmentData.id),
        String(shipmentData.content),
        parseFloat(shipmentData.min_temp),
        parseFloat(shipmentData.max_temp),
        {
          latitude: parseFloat(shipmentData.start_lat),
          longitude: parseFloat(shipmentData.start_lng)
        },
        {
          latitude: parseFloat(shipmentData.end_lat),
          longitude: parseFloat(shipmentData.end_lng)
        },
        String(shipmentData.sender_information),
        String(shipmentData.receiver_information),
      );

      console.log("✅ Shipment creation reducer called successfully");
      setSuccess("Shipment created successfully!");
    } catch (e) {
      console.error("❌ Error creating shipment:", e);
      setError(e.message || String(e));
    }
  };

  // ---------- Driver creation handler ----------
  const handleCreateDriver = async (driverData) => {
    try {
      if (!conn) throw new Error("Not connected");

      console.log("🚛 Creating driver with data:", driverData);
      console.log("🚛 Current drivers before creation:", drivers.length);

      await conn.reducers.createDriver(
        BigInt(driverData.id),
        String(driverData.status),
        {
          latitude: parseFloat(driverData.current_lat),
          longitude: parseFloat(driverData.current_lng)
        },
        BigInt(Date.now() * 1000) // Convert to microseconds
      );

      console.log("✅ Driver creation reducer called successfully");
      setSuccess("Driver created successfully!");
    } catch (e) {
      console.error("❌ Error creating driver:", e);
      setError(e.message || String(e));
    }
  };

  // ---------- Test data creation handler ----------
  const handleCreateTestData = async () => {
    try {
      if (!conn) throw new Error("Not connected");

      console.log("🧪 Creating test data...");

      // Create a test shipment
      await conn.reducers.createShipment(
        999,
        "Test Shipment",
        "in transit",
        2.0,
        8.0,
        { latitude: 40.7128, longitude: -74.0060 }, // NYC
        { latitude: 40.7128, longitude: -74.0060 }, // NYC
        { latitude: 34.0522, longitude: -118.2437 }, // LA
        "Test Sender",
        "Test Receiver"
      );

      // Create a test driver
      await conn.reducers.createDriver(
        BigInt(888),
        "available",
        { latitude: 40.7589, longitude: -73.9851 }, // NYC
        BigInt(Date.now() * 1000)
      );

      setSuccess("Test data created successfully! Refresh the page to see persistence.");
    } catch (e) {
      console.error("❌ Error creating test data:", e);
      setError(e.message || String(e));
    }
  };

  // ---------- UI (new layout per your sketch) ----------
  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          COLD TRACE
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleCreateTestData}
            disabled={!connected}
          >
            Create Test Data
          </Button>
          <Chip
            label={connected ? "🟢 Connected" : error ? "⚠️ Error" : "🔴 Disconnected"}
            color={connected ? "success" : error ? "warning" : "default"}
            variant="outlined"
          />
        </Box>
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
        {/* MAP */}
        <Grid item sx={{ flex: "0 0 60%" }}>
          <Box
            sx={{
              height: "70vh",
              minHeight: 350,
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

        {/* SHIPMENTS AND DRIVERS PANE */}
        <Grid item sx={{ flex: "0 0 34vw" }}>
          <Box
            sx={{
              height: "70vh",
              minHeight: 350,
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "#f6f6f6",
              border: "1px solid #e0e0e0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* SHIPMENTS PANE */}
            <Box sx={{ flex: "0 0 50%", borderBottom: "1px solid #e0e0e0" }}>
              <TruckList
                shipments={shipments}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onCreateShipment={handleCreateShipment}
              />
            </Box>
            
            {/* DRIVERS PANE */}
            <Box sx={{ flex: "0 0 50%" }}>
              <DriverList
                drivers={drivers}
                selectedId={selectedDriverId}
                onSelect={setSelectedDriverId}
                onCreateDriver={handleCreateDriver}
              />
            </Box>
          </Box>
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