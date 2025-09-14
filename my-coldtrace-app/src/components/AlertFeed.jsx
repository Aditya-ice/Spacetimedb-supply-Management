import React from "react";
import { Paper, Box, Typography, FormControlLabel, Switch, Divider, List, ListItem, ListItemText } from "@mui/material";
import { tsToMillis } from "../utils";

export default function AlertFeed({ alerts, showAll, onToggle }) {
  const sorted = [...alerts].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  const visible = showAll ? sorted : sorted.slice(0, 5);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6">Alerts</Typography>
        <FormControlLabel control={<Switch checked={showAll} onChange={(e) => onToggle(e.target.checked)} />} label="Show all" />
      </Box>
      <Divider sx={{ my: 1 }} />
      <List dense>
        {visible.map((a) => (
          <ListItem
            key={a.id}
            sx={{ borderLeft: "4px solid #ef5350", bgcolor: "rgba(239,83,80,.06)", mb: 1, borderRadius: 1 }}
          >
            <ListItemText
              primary={a.message || "Alert"}
              secondary={`Truck ${a.shipment_id ?? a.shipmentId} • ${new Date(tsToMillis(a.timestamp)).toLocaleString()}`}
            />
          </ListItem>
        ))}
        {!alerts.length && <ListItem><ListItemText primary="No alerts yet" /></ListItem>}
      </List>
    </Paper>
  );
}
