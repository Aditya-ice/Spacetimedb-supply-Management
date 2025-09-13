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
  Divider
} from '@mui/material';

function App() {
  const [connected, setConnected] = useState(false);
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

  // Test connection on component mount
  useEffect(() => {
    // Simulate connection for now
    setTimeout(() => {
      setConnected(true);
    }, 1000);
  }, []);

  const handleCreateShipment = async () => {
    try {
      setError(null);
      // Simulate API call
      const shipment = {
        id: parseInt(newShipment.id),
        name: newShipment.name,
        status: newShipment.status,
        min_temp: parseFloat(newShipment.minTemp),
        max_temp: parseFloat(newShipment.maxTemp)
      };
      setShipments(prev => [...prev, shipment]);
      setSuccess('Shipment created successfully!');
      setNewShipment({ id: '', name: '', status: 'In Transit', minTemp: '', maxTemp: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProcessReading = async () => {
    try {
      setError(null);
      const timestamp = Math.floor(Date.now() / 1000);
      const reading = {
        id: sensorReadings.length + 1,
        shipment_id: parseInt(newReading.shipmentId),
        timestamp: timestamp,
        temperature: parseFloat(newReading.temperature)
      };
      setSensorReadings(prev => [...prev, reading]);

      // Check if temperature is out of bounds (simplified)
      const shipment = shipments.find(s => s.id === parseInt(newReading.shipmentId));
      if (shipment && (reading.temperature < shipment.min_temp || reading.temperature > shipment.max_temp)) {
        const alert = {
          id: alerts.length + 1,
          shipment_id: parseInt(newReading.shipmentId),
          message: `ALERT: Temperature excursion! Current: ${reading.temperature}°C`,
          timestamp: timestamp
        };
        setAlerts(prev => [...prev, alert]);
      }

      setSuccess('Sensor reading processed successfully!');
      setNewReading({ shipmentId: '', temperature: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGetStatus = async (shipmentId) => {
    try {
      setError(null);
      setSuccess(`Status retrieved for shipment ${shipmentId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          🚚 Cold Trace Supply Chain Management
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Chip
            label={connected ? '🟢 Connected to SpacetimeDB' : '🔴 Disconnected'}
            color={connected ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Create Shipment Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              📦 Create New Shipment
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Shipment ID"
                type="number"
                value={newShipment.id}
                onChange={(e) => setNewShipment({ ...newShipment, id: e.target.value })}
                fullWidth
              />
              <TextField
                label="Shipment Name"
                value={newShipment.name}
                onChange={(e) => setNewShipment({ ...newShipment, name: e.target.value })}
                fullWidth
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
                value={newShipment.minTemp}
                onChange={(e) => setNewShipment({ ...newShipment, minTemp: e.target.value })}
                fullWidth
              />
              <TextField
                label="Max Temperature (°C)"
                type="number"
                value={newShipment.maxTemp}
                onChange={(e) => setNewShipment({ ...newShipment, maxTemp: e.target.value })}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleCreateShipment}
                disabled={!connected}
                fullWidth
              >
                Create Shipment
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Process Sensor Reading Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🌡️ Process Sensor Reading
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Shipment ID"
                type="number"
                value={newReading.shipmentId}
                onChange={(e) => setNewReading({ ...newReading, shipmentId: e.target.value })}
                fullWidth
              />
              <TextField
                label="Temperature (°C)"
                type="number"
                value={newReading.temperature}
                onChange={(e) => setNewReading({ ...newReading, temperature: e.target.value })}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleProcessReading}
                disabled={!connected}
                fullWidth
              >
                Process Reading
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Shipments List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              📦 Shipments ({shipments.length})
            </Typography>
            <List>
              {shipments.map((shipment) => (
                <Card key={shipment.id} sx={{ mb: 1 }}>
                  <CardContent sx={{ pb: 1 }}>
                    <Typography variant="h6">{shipment.name}</Typography>
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
                      disabled={!connected}
                    >
                      Get Status
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sensor Readings List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🌡️ Sensor Readings ({sensorReadings.length})
            </Typography>
            <List>
              {sensorReadings.slice(-10).reverse().map((reading) => (
                <ListItem key={reading.id} divider>
                  <ListItemText
                    primary={`Shipment ${reading.shipment_id}: ${reading.temperature}°C`}
                    secondary={new Date(reading.timestamp * 1000).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Alerts List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🚨 Alerts ({alerts.length})
            </Typography>
            <List>
              {alerts.slice(-10).reverse().map((alert) => (
                <ListItem key={alert.id} divider>
                  <ListItemText
                    primary={alert.message}
                    secondary={`Shipment ${alert.shipment_id} - ${new Date(alert.timestamp * 1000).toLocaleString()}`}
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

export default App;