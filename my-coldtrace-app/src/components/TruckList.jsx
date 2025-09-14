import React, { useState } from "react";
import {
  Paper, Typography, List, ListItem, ListItemText,
  TextField, Button, Box, Divider, IconButton, Collapse
} from "@mui/material";
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

  // This is the corrected handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!newShipment.id.trim() || !newShipment.content.trim()) {
      alert("Shipment ID and Content are required.");
      return;
    }

    // Prepare a complete data object, including the missing fields
    const formattedData = {
      ...newShipment,
      status: "in transit", // Add the missing 'status' field
    };

    if (onCreateShipment) {
      await onCreateShipment(formattedData);
      // Reset form
      setNewShipment({
        id: "", content: "", min_temp: "", max_temp: "",
        start_lat: "", start_lng: "", end_lat: "", end_lng: "",
        sender_information: "", receiver_information: "",
      });
      setShowForm(false);
    }
  };

  return (
    <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6">Shipments</Typography>
        <IconButton size="small" onClick={() => setShowForm(!showForm)} color="primary">
          {showForm ? "−" : "+"}
        </IconButton>
      </Box>

      <Collapse in={showForm}>
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Add New Shipment</Typography>
          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
            <TextField size="small" label="Shipment ID" value={newShipment.id} onChange={e => setNewShipment(s => ({ ...s, id: e.target.value }))} required />
            <TextField size="small" label="Content" value={newShipment.content} onChange={e => setNewShipment(s => ({ ...s, content: e.target.value }))} required />
            <TextField size="small" label="Min Temp" type="number" value={newShipment.min_temp} onChange={e => setNewShipment(s => ({ ...s, min_temp: e.target.value }))} />
            <TextField size="small" label="Max Temp" type="number" value={newShipment.max_temp} onChange={e => setNewShipment(s => ({ ...s, max_temp: e.target.value }))} />
            <TextField size="small" label="Start Lat" value={newShipment.start_lat} onChange={e => setNewShipment(s => ({ ...s, start_lat: e.target.value }))} />
            <TextField size="small" label="Start Lng" value={newShipment.start_lng} onChange={e => setNewShipment(s => ({ ...s, start_lng: e.target.value }))} />
            <TextField size="small" label="End Lat" value={newShipment.end_lat} onChange={e => setNewShipment(s => ({ ...s, end_lat: e.target.value }))} />
            <TextField size="small" label="End Lng" value={newShipment.end_lng} onChange={e => setNewShipment(s => ({ ...s, end_lng: e.target.value }))} />
            <TextField size="small" label="Sender Info" value={newShipment.sender_information} onChange={e => setNewShipment(s => ({ ...s, sender_information: e.target.value }))} />
            <TextField size="small" label="Receiver Info" value={newShipment.receiver_information} onChange={e => setNewShipment(s => ({ ...s, receiver_information: e.target.value }))} />
          </Box>
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button type="submit" variant="contained" size="small">Create Shipment</Button>
            <Button type="button" variant="outlined" size="small" onClick={() => setShowForm(false)}>Cancel</Button>
          </Box>
        </Box>
      </Collapse>

      <Divider sx={{ mb: 1 }} />
      <div style={{ overflowY: "auto", flex: 1 }}>
        <List dense>
          {(shipments || []).map((s) => {
            const isSel = String(s.id) === String(selectedId);
            const startLoc = parseLocation(s.startLocation);
            return (
              <ListItem key={s.id.toString()} button selected={isSel} onClick={() => onSelect?.(s.id)} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemText primary={`#${s.id}: ${s.content}`} secondary={startLoc ? `From: ${startLoc[0].toFixed(3)}, ${startLoc[1].toFixed(3)}` : "No location"} />
              </ListItem>
            );
          })}
          {(!shipments || shipments.length === 0) && <ListItem><ListItemText primary="No shipments yet" /></ListItem>}
        </List>
      </div>
    </Paper>
  );
}