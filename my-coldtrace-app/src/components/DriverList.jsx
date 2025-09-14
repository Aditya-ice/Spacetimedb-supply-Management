import React, { useState } from "react";
import { Button, TextField, Box, Typography, Paper } from "@mui/material";

// This is the combined and corrected component.
// It includes both fixes:
// 1. `drivers = []` to prevent the '.map is not a function' error.
// 2. The `handleCreate` function validates and parses form data correctly.

const DriverList = ({ drivers = [], selectedId, onSelect, onCreateDriver }) => {
  const [newDriver, setNewDriver] = useState({
    id: "",
    status: "available", // Default status
    current_lat: "",
    current_lng: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDriver((prev) => ({ ...prev, [name]: value }));
  };

  // Replace your entire handleCreate function with this one.

  const handleCreate = () => {
    // --- PART 1: VALIDATION (You already have this) ---
    if (!newDriver.id || !newDriver.current_lat || !newDriver.current_lng) {
      alert("Please fill in all fields for the new driver.");
      return;
    }

    // --- PART 2: DATA TYPE CONVERSION (This is the missing piece) ---
    const formattedDriverData = {
      ...newDriver, // Copies status and any other properties
      id: newDriver.id, // Pass the ID as a string; App.jsx will handle BigInt conversion
      current_lat: parseFloat(newDriver.current_lat), // Convert lat string to a number
      current_lng: parseFloat(newDriver.current_lng), // Convert lng string to a number
    };

    // --- PART 3: FINAL CHECK & SUBMISSION ---
    // Verify that the conversion to numbers was successful
    if (isNaN(formattedDriverData.current_lat) || isNaN(formattedDriverData.current_lng)) {
      alert("Latitude and Longitude must be valid numbers.");
      return;
    }

    // Now, send the CLEAN and CORRECTLY TYPED data to App.jsx
    onCreateDriver(formattedDriverData);

    // Reset the form
    setNewDriver({ id: "", status: "available", current_lat: "", current_lng: "" });
  };

  return (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Drivers
      </Typography>
      <Box sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
        {/* --- FIX #2: `drivers` is now guaranteed to be an array --- */}
        {drivers.map((driver) => (
          <Paper
            key={String(driver.id)}
            onClick={() => onSelect(String(driver.id))}
            elevation={selectedId === String(driver.id) ? 4 : 1}
            sx={{
              p: 1.5,
              mb: 1,
              cursor: "pointer",
              border: selectedId === String(driver.id) ? "2px solid #1976d2" : "2px solid transparent",
              transition: "border 0.2s, box-shadow 0.2s",
            }}
          >
            <Typography variant="body2">
              <strong>ID:</strong> {String(driver.id)}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {driver.status}
            </Typography>
          </Paper>
        ))}
      </Box>
      <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Add New Driver
        </Typography>
        <TextField
          label="Driver ID"
          name="id"
          value={newDriver.id}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
          size="small"
        />
        <TextField
          label="Latitude"
          name="current_lat"
          value={newDriver.current_lat}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
          size="small"
        />
        <TextField
          label="Longitude"
          name="current_lng"
          value={newDriver.current_lng}
          onChange={handleInputChange}
          fullWidth
          margin="dense"
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleCreate}
          fullWidth
          sx={{ mt: 1 }}
        >
          Add Driver
        </Button>
      </Box>
    </Box>
  );
};

export default DriverList;