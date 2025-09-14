import React, { useState } from "react";
import {
  Paper, Typography, List, ListItem, ListItemText,
  TextField, Button, Box, Divider, IconButton, Collapse
} from "@mui/material";
import { parseLocation } from "../utils";

export default function DriverList({ drivers = [], selectedId, onSelect, onCreateDriver }) {
  const [showForm, setShowForm] = useState(false);
  const [newDriver, setNewDriver] = useState({
    id: "",
    status: "available",
    current_lat: "",
    current_lng: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, status, current_lat, current_lng } = newDriver;

    if (!id.trim() || !current_lat.trim() || !current_lng.trim()) {
      alert("Error: Driver ID, Latitude, and Longitude are required.");
      return;
    }

    let driverIdAsBigInt;
    try {
      driverIdAsBigInt = BigInt(id.trim());
    } catch (error) {
      alert(`Error: Invalid Driver ID "${id}". It must be a whole number.`);
      return;
    }

    const finalLat = parseFloat(current_lat);
    const finalLng = parseFloat(current_lng);

    if (isNaN(finalLat) || isNaN(finalLng)) {
      alert("Error: Latitude and Longitude must be valid numbers.");
      return;
    }

    const finalDriverData = {
      id: driverIdAsBigInt,
      status: status,
      current_lat: finalLat,
      current_lng: finalLng,
    };

    if (onCreateDriver) {
      await onCreateDriver(finalDriverData);
      setNewDriver({ id: "", status: "available", current_lat: "", current_lng: "" });
      setShowForm(false);
    }
  };

  return (
    <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6">Drivers</Typography>
        <IconButton size="small" onClick={() => setShowForm(!showForm)} color="primary">
          {showForm ? "−" : "+"}
        </IconButton>
      </Box>

      <Collapse in={showForm}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Add New Driver</Typography>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
            <TextField size="small" label="Driver ID" type="text" inputMode="numeric" value={newDriver.id} onChange={e => setNewDriver(s => ({ ...s, id: e.target.value }))} required />
            <TextField size="small" label="Status" select value={newDriver.status} onChange={e => setNewDriver(s => ({ ...s, status: e.target.value }))} SelectProps={{ native: true }} required>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </TextField>
            <TextField size="small" label="Current Lat" type="text" inputMode="decimal" value={newDriver.current_lat} onChange={e => setNewDriver(s => ({ ...s, current_lat: e.target.value }))} required />
            <TextField size="small" label="Current Lng" type="text" inputMode="decimal" value={newDriver.current_lng} onChange={e => setNewDriver(s => ({ ...s, current_lng: e.target.value }))} required />
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button type="submit" variant="contained" size="small">Create Driver</Button>
            <Button type="button" variant="outlined" size="small" onClick={() => setShowForm(false)}>Cancel</Button>
          </Box>
        </Box>
      </Collapse>

      <Divider sx={{ mb: 1 }} />

      <div style={{ overflowY: "auto", flex: 1 }}>
        <List dense>
          {(drivers || []).map((d) => {
            const isSel = String(d.id) === String(selectedId);
            const loc = parseLocation(d.currentLocation);
            return (
              <ListItem key={d.id.toString()} button selected={isSel} onClick={() => onSelect?.(d.id)} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemText primary={`Driver #${d.id} — ${d.status}`} secondary={loc ? `${loc[0].toFixed(3)}, ${loc[1].toFixed(3)}` : "no location"} />
              </ListItem>
            );
          })}
          {(!drivers || drivers.length === 0) && <ListItem><ListItemText primary="No drivers yet" /></ListItem>}
        </List>
      </div>
    </Paper>
  );
}