import React from "react";
import { Paper, Typography, List, ListItem, ListItemText } from "@mui/material";
import { parseLocation } from "../utils";

export default function TruckList({ shipments, selectedId, onSelect }) {
  return (
    <Paper sx={{ p: 2, height:"100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" gutterBottom>Trucks</Typography>
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
