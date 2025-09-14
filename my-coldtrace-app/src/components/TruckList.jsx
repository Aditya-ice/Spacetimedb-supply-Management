import React, { useState } from "react";
import {
  Paper, Typography, List, ListItem, ListItemText,
  TextField, Button, Box, Divider, IconButton, Collapse
} from "@mui/material";
import { Add, ExpandLess, ExpandMore } from "@mui/icons-material";
import { parseLocation } from "../utils";

export default function TruckList({ shipments, selectedId, onSelect, onCreateShipment }) {
  const [showForm, setShowForm] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onCreateShipment) {
      await onCreateShipment(newShipment);
      setNewShipment({
        id: "", content: "", min_temp: "", max_temp: "",
        start_lat: "", start_lng: "", end_lat: "", end_lng: "",
        sender_information: "", receiver_information: ""
      });
      setShowForm(false);
    }
  };

  return (
    <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6">Trucks</Typography>
        <IconButton
          size="small"
          onClick={() => setShowForm(!showForm)}
          color="primary"
        >
          {showForm ? <ExpandLess /> : <Add />}
        </IconButton>
      </Box>

      <Collapse in={showForm}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Add New Shipment</Typography>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
            <TextField
              size="small"
              label="ID"
              type="number"
              value={newShipment.id}
              onChange={e => setNewShipment(s => ({ ...s, id: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Content"
              value={newShipment.content}
              onChange={e => setNewShipment(s => ({ ...s, content: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Min Temp (°C)"
              type="number"
              value={newShipment.min_temp}
              onChange={e => setNewShipment(s => ({ ...s, min_temp: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Max Temp (°C)"
              type="number"
              value={newShipment.max_temp}
              onChange={e => setNewShipment(s => ({ ...s, max_temp: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Start Lat"
              type="number"
              step="0.000001"
              value={newShipment.start_lat}
              onChange={e => setNewShipment(s => ({ ...s, start_lat: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Start Lng"
              type="number"
              step="0.000001"
              value={newShipment.start_lng}
              onChange={e => setNewShipment(s => ({ ...s, start_lng: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="End Lat"
              type="number"
              step="0.000001"
              value={newShipment.end_lat}
              onChange={e => setNewShipment(s => ({ ...s, end_lat: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="End Lng"
              type="number"
              step="0.000001"
              value={newShipment.end_lng}
              onChange={e => setNewShipment(s => ({ ...s, end_lng: e.target.value }))}
              required
            />
            <TextField
              size="small"
              label="Sender Info"
              value={newShipment.sender_information}
              onChange={e => setNewShipment(s => ({ ...s, sender_information: e.target.value }))}
              required
              sx={{ gridColumn: "1 / -1" }}
            />
            <TextField
              size="small"
              label="Receiver Info"
              value={newShipment.receiver_information}
              onChange={e => setNewShipment(s => ({ ...s, receiver_information: e.target.value }))}
              required
              sx={{ gridColumn: "1 / -1" }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button type="submit" variant="contained" size="small">
              Create Shipment
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Collapse>

      <Divider sx={{ mb: 1 }} />

      <div style={{ overflowY: "auto", flex: 1 }}>
        <List dense>
          {shipments.map((s) => {
            const isSel = s.id === selectedId;
            const loc = parseLocation(s.current_location ?? s.currentLocation);
            return (
              <ListItem
                key={s.id}
                button
                selected={isSel}
                onClick={() => onSelect?.(s.id)}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemText
                  primary={`Truck #${s.id} — ${s.status}`}
                  secondary={
                    (s.current_temp != null ? `Temp ${s.current_temp}°C • ` : "") +
                    (loc ? `${loc[0].toFixed(3)}, ${loc[1].toFixed(3)}` : "no location")
                  }
                />
              </ListItem>
            );
          })}
          {!shipments.length && <ListItem><ListItemText primary="No trucks yet" /></ListItem>}
        </List>
      </div>
    </Paper>
  );
}
