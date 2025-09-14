import React from "react";
import {
  Paper, Box, Typography, FormControlLabel, Switch,
  Divider, List, ListItem, ListItemText
} from "@mui/material";
import { tsToMillis } from "../utils";

export default function AlertFeed({ alerts, showAll, onToggle }) {
  const sorted = [...alerts].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  const visible = showAll ? sorted : sorted.slice(0, 5);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          width: "100%",             // was 100vw → caused overflow
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",          // allow wrap on narrow screens
        }}
      >
        <Typography variant="h6" sx={{ flexShrink: 0 }}>Alerts</Typography>
        <Box sx={{ ml: "auto" }}>
          <FormControlLabel
            control={
              <Switch
                checked={showAll}
                onChange={(e) => onToggle(e.target.checked)}
              />
            }
            label="Show all"
          />
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* List */}
      <List dense sx={{ maxWidth: "100%" }}>
        {visible.map((a) => (
          <ListItem
            key={a.id}
            sx={{
              borderLeft: "4px solid #ef5350",
              bgcolor: "rgba(239,83,80,.06)",
              mb: 1,
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={a.message || "Alert"}
              secondary={`Truck ${a.shipment_id ?? a.shipmentId} • ${new Date(
                tsToMillis(a.timestamp)
              ).toLocaleString()}`}
            />
          </ListItem>
        ))}
        {!alerts.length && (
          <ListItem>
            <ListItemText primary="No alerts yet" />
          </ListItem>
        )}
      </List>
    </Paper>
  );
}