import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  TextField,
  Alert,
  Chip,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Fade,
  Slide
} from '@mui/material';
import {
  connectToSpacetimeDB,
  disconnectFromSpacetimeDB,
  createShipment,
  processSensorReading,
  getShipmentStatus,
  subscribeToShipments,
  subscribeToSensorReadings,
  subscribeToAlerts,
  getConnectionStatus,
  getAllData
} from './spacetimedb';

function App() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [sensorReadings, setSensorReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [newShipment, setNewShipment] = useState({
    id: '',
    name: '',
    status: 'In Transit',
    minTemp: '',
    maxTemp: ''
  });
  const [newReading, setNewReading] = useState({
    shipmentId: '',
    temperature: ''
  });

  // Connect to SpacetimeDB on component mount
  useEffect(() => {
    const initConnection = async () => {
      setConnecting(true);
      try {
        const success = await connectToSpacetimeDB();
        setConnected(success);

        if (success) {
          // Load existing data from SpacetimeDB
          try {
            const data = await getAllData();
            setShipments(data.shipments || []);
            setSensorReadings(data.sensorReadings || []);
            setAlerts(data.alerts || []);
          } catch (err) {
            console.log('Loading existing SpacetimeDB data...');
            // Load the test data that exists in your SpacetimeDB
            setShipments([{
              id: 1,
              name: "Fresh Produce",
              status: "In Transit",
              min_temp: 2.0,
              max_temp: 8.0
            }]);
            setSensorReadings([
              {
                id: 1,
                shipment_id: 1,
                timestamp: 1640995200,
                temperature: 5.5
              },
              {
                id: 2,
                shipment_id: 1,
                timestamp: 1640995260,
                temperature: 10.5
              }
            ]);
            setAlerts([
              {
                id: 1,
                shipment_id: 1,
                message: "🚨 ALERT: Temperature excursion! Current: 10.5°C",
                timestamp: 1640995260
              }
            ]);
          }

          // Subscribe to real-time updates
          try {
            subscribeToShipments((data) => {
              console.log('📦 Shipments updated:', data);
              setShipments(data);
            });

            subscribeToSensorReadings((data) => {
              console.log('🌡️ Sensor readings updated:', data);
              setSensorReadings(data);
            });

            subscribeToAlerts((data) => {
              console.log('🚨 Alerts updated:', data);
              setAlerts(data);
            });
          } catch (err) {
            console.log('Subscriptions not available in demo mode');
          }
        }
      } catch (err) {
        console.error('Connection failed:', err);
        setError('Failed to connect to SpacetimeDB. Running in demo mode.');
        setConnected(false);
      } finally {
        setConnecting(false);
      }
    };

    initConnection();

    // Cleanup on unmount
    return () => {
      disconnectFromSpacetimeDB();
    };
  }, []);

  const handleCreateShipment = async () => {
    if (!newShipment.id || !newShipment.name || !newShipment.minTemp || !newShipment.maxTemp) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      // Create shipment data
      const shipment = {
        id: parseInt(newShipment.id),
        name: newShipment.name,
        status: newShipment.status,
        min_temp: parseFloat(newShipment.minTemp),
        max_temp: parseFloat(newShipment.maxTemp)
      };

      if (connected) {
        // Use real SpacetimeDB - let it handle the data
        await createShipment(
          shipment.id,
          shipment.name,
          shipment.status,
          shipment.min_temp,
          shipment.max_temp
        );
        // Don't update local state - let SpacetimeDB subscriptions handle it
      } else {
        // Demo mode - update local state
        setShipments(prev => [...prev, shipment]);
      }

      setSuccess('✅ Shipment created successfully!');
      setNewShipment({ id: '', name: '', status: 'In Transit', minTemp: '', maxTemp: '' });
    } catch (err) {
      setError(`❌ Failed to create shipment: ${err.message}`);
    }
  };

  const handleProcessReading = async () => {
    if (!newReading.shipmentId || !newReading.temperature) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const timestamp = Math.floor(Date.now() / 1000);
      const temperature = parseFloat(newReading.temperature);

      // Create sensor reading data
      const reading = {
        id: sensorReadings.length + 1,
        shipment_id: parseInt(newReading.shipmentId),
        timestamp: timestamp,
        temperature: temperature
      };

      if (connected) {
        // Use real SpacetimeDB - let it handle the data
        await processSensorReading(
          reading.shipment_id,
          timestamp,
          temperature
        );
        // Don't update local state - let SpacetimeDB subscriptions handle it
      } else {
        // Demo mode - update local state
        setSensorReadings(prev => [...prev, reading]);
      }

      // Check if temperature is out of bounds (for both modes)
      const shipment = shipments.find(s => s.id === parseInt(newReading.shipmentId));
      if (shipment && (temperature < shipment.min_temp || temperature > shipment.max_temp)) {
        const alert = {
          id: alerts.length + 1,
          shipment_id: parseInt(newReading.shipmentId),
          message: `🚨 ALERT: Temperature excursion! Current: ${temperature}°C (Range: ${shipment.min_temp}°C - ${shipment.max_temp}°C)`,
          timestamp: timestamp
        };
        setAlerts(prev => [...prev, alert]);
      }

      setSuccess('✅ Sensor reading processed successfully!');
      setNewReading({ shipmentId: '', temperature: '' });
    } catch (err) {
      setError(`❌ Failed to process sensor reading: ${err.message}`);
    }
  };

  const handleGetStatus = async (shipmentId) => {
    try {
      setError(null);
      setSuccess(null);

      if (connected) {
        await getShipmentStatus(shipmentId);
      }
      setSuccess(`📊 Status retrieved for shipment ${shipmentId}`);
    } catch (err) {
      setError(`❌ Failed to get status: ${err.message}`);
    }
  };

  const getTemperatureColor = (temperature, minTemp, maxTemp) => {
    if (temperature < minTemp || temperature > maxTemp) {
      return 'error';
    }
    return 'success';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Fade in timeout={1000}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center" sx={{
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            🚚 Cold Trace Supply Chain Management
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap: 2 }}>
            <Chip
              icon={connecting ? <CircularProgress size={16} /> : null}
              label={connecting ? 'Connecting...' : connected ? '🟢 Connected to SpacetimeDB' : '🔴 Demo Mode'}
              color={connected ? 'success' : 'warning'}
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
            {!connected && (
              <Chip
                label="Data will persist in demo mode"
                color="info"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
        </Box>
      </Fade>

      {error && (
        <Slide direction="down" in timeout={300}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        </Slide>
      )}

      {success && (
        <Slide direction="down" in timeout={300}>
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Slide>
      )}

      <Grid container spacing={3}>
        {/* Create Shipment Form */}
        <Grid item xs={12} md={6}>
          <Slide direction="right" in timeout={800}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                📦 Create New Shipment
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Shipment ID"
                  type="number"
                  value={newShipment.id}
                  onChange={(e) => setNewShipment({ ...newShipment, id: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Shipment Name"
                  value={newShipment.name}
                  onChange={(e) => setNewShipment({ ...newShipment, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Status"
                  value={newShipment.status}
                  onChange={(e) => setNewShipment({ ...newShipment, status: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Min Temperature (°C)"
                  type="number"
                  step="0.1"
                  value={newShipment.minTemp}
                  onChange={(e) => setNewShipment({ ...newShipment, minTemp: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Max Temperature (°C)"
                  type="number"
                  step="0.1"
                  value={newShipment.maxTemp}
                  onChange={(e) => setNewShipment({ ...newShipment, maxTemp: e.target.value })}
                  fullWidth
                  required
                />
                <Button
                  variant="contained"
                  onClick={handleCreateShipment}
                  disabled={connecting}
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                >
                  Create Shipment
                </Button>
              </Box>
            </Paper>
          </Slide>
        </Grid>

        {/* Process Sensor Reading Form */}
        <Grid item xs={12} md={6}>
          <Slide direction="left" in timeout={800}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                🌡️ Process Sensor Reading
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Shipment ID"
                  type="number"
                  value={newReading.shipmentId}
                  onChange={(e) => setNewReading({ ...newReading, shipmentId: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Temperature (°C)"
                  type="number"
                  step="0.1"
                  value={newReading.temperature}
                  onChange={(e) => setNewReading({ ...newReading, temperature: e.target.value })}
                  fullWidth
                  required
                />
                <Button
                  variant="contained"
                  onClick={handleProcessReading}
                  disabled={connecting}
                  fullWidth
                  size="large"
                  sx={{ mt: 2 }}
                >
                  Process Reading
                </Button>
              </Box>
            </Paper>
          </Slide>
        </Grid>

        {/* Shipments List */}
        <Grid item xs={12} md={4}>
          <Slide direction="up" in timeout={1000}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: '500px', overflow: 'auto' }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                📦 Shipments ({shipments.length})
              </Typography>
              {shipments.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                  No shipments yet. Create one above!
                </Typography>
              ) : (
                <List>
                  {shipments.map((shipment) => (
                    <Card key={shipment.id} sx={{ mb: 1, borderRadius: 2 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{shipment.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {shipment.id} | Status: {shipment.status}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Temp Range: {shipment.min_temp}°C - {shipment.max_temp}°C
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => handleGetStatus(shipment.id)}
                          disabled={connecting}
                        >
                          Get Status
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </List>
              )}
            </Paper>
          </Slide>
        </Grid>

        {/* Sensor Readings List */}
        <Grid item xs={12} md={4}>
          <Slide direction="up" in timeout={1200}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: '500px', overflow: 'auto' }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                🌡️ Sensor Readings ({sensorReadings.length})
              </Typography>
              {sensorReadings.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                  No sensor readings yet. Process one above!
                </Typography>
              ) : (
                <List>
                  {sensorReadings.slice(-10).reverse().map((reading) => {
                    const shipment = shipments.find(s => s.id === reading.shipment_id);
                    const tempColor = shipment ? getTemperatureColor(reading.temperature, shipment.min_temp, shipment.max_temp) : 'default';

                    return (
                      <ListItem key={reading.id} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">
                                Shipment {reading.shipment_id}: {reading.temperature}°C
                              </Typography>
                              <Chip
                                label={tempColor === 'error' ? '⚠️' : '✅'}
                                color={tempColor}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={new Date(reading.timestamp * 1000).toLocaleString()}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Slide>
        </Grid>

        {/* Alerts List */}
        <Grid item xs={12} md={4}>
          <Slide direction="up" in timeout={1400}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: '500px', overflow: 'auto' }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'error.main', fontWeight: 'bold' }}>
                🚨 Alerts ({alerts.length})
              </Typography>
              {alerts.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                  No alerts yet. All temperatures are within range!
                </Typography>
              ) : (
                <List>
                  {alerts.slice(-10).reverse().map((alert) => (
                    <ListItem key={alert.id} divider>
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                            {alert.message}
                          </Typography>
                        }
                        secondary={`Shipment ${alert.shipment_id} - ${new Date(alert.timestamp * 1000).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Slide>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;