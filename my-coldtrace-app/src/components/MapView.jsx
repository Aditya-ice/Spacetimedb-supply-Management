// src/components/MapView.jsx
import React, { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { parseLocation, tsToMillis } from "../utils";

// Use CDN icons so markers work without bundler asset config
const truckIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

function MapFocus({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, Math.max(map.getZoom(), 6), { duration: 0.5 });
  }, [center, map]);
  return null;
}

export default function MapView({ shipments = [], selectedId, onSelect }) {
  // simple diagnostics to verify it’s actually rendering
  useEffect(() => {
    console.log("[MapView] mounted; shipments:", shipments.length);
  }, [shipments.length]);

  const defaultCenter = [20, 0];
  const selected = shipments.find((s) => s.id === selectedId);
  const selectedCenter = selected
    ? parseLocation(selected.current_location ?? selected.currentLocation)
    : null;

  return (
    <MapContainer
      center={selectedCenter || defaultCenter}
      zoom={selectedCenter ? 6 : 2}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {selectedCenter && <MapFocus center={selectedCenter} />}

      {shipments.map((s) => {
        const pos = parseLocation(s.current_location ?? s.currentLocation);
        if (!pos) return null;
        return (
          <Marker
            key={s.id}
            position={pos}
            icon={truckIcon}
            eventHandlers={{ click: () => onSelect?.(s.id) }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <b>Truck #{s.id}</b><br />
                {s.content || "—"}<br />
                Status: {s.status}<br />
                Temp: {s.currentTemp ?? "—"}°C<br />
                <small>{new Date(tsToMillis(s.timestamp)).toLocaleString()}</small>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
