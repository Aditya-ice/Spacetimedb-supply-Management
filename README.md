# Supply Chain Management with SpacetimeDB

A real-time supply chain management system built with SpacetimeDB that tracks shipments and monitors temperature conditions using IoT sensors.

## 🚀 Features

- **Shipment Management**: Create and track shipments with temperature requirements
- **Real-time Monitoring**: Process temperature readings from IoT sensors
- **Automatic Alerting**: Generate alerts when temperatures exceed safe ranges
- **Data Persistence**: All data stored in SpacetimeDB tables for real-time access
- **SQL Queries**: Query shipment data, sensor readings, and alerts

## 📋 Prerequisites

- [Rust](https://rustup.rs/) (latest stable version)
- [SpacetimeDB CLI](https://spacetimedb.com/docs/getting-started)

## 🛠️ Installation

1. **Install SpacetimeDB CLI:**
   ```bash
   curl -sSfL https://install.spacetimedb.com | sh
   export PATH="$HOME/.local/bin:$PATH"
   ```

2. **Install Rust (if not already installed):**
   ```bash
   curl https://sh.rustup.rs -sSf | sh
   source ~/.cargo/env
   rustup target add wasm32-unknown-unknown
   ```

3. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd hophacks
   ```

## 🚀 Getting Started

1. **Start SpacetimeDB server:**
   ```bash
   spacetime start
   ```

2. **Publish the module:**
   ```bash
   cd supply-chain
   spacetime publish supply-chain
   ```

3. **Create a shipment:**
   ```bash
   spacetime call supply-chain create_shipment 1 "Fresh Produce" "In Transit" 2.0 8.0
   ```

4. **Process sensor readings:**
   ```bash
   # Normal temperature (no alert)
   spacetime call supply-chain process_sensor_reading 1 1640995200 5.5
   
   # Out of bounds temperature (triggers alert)
   spacetime call supply-chain process_sensor_reading 1 1640995260 10.5
   ```

## 📊 Database Schema

### Shipment Table
- `id` (u64, primary key): Unique shipment identifier
- `name` (String): Shipment name/description
- `status` (String): Current status (e.g., "In Transit", "Delivered")
- `min_temp` (f32): Minimum safe temperature
- `max_temp` (f32): Maximum safe temperature

### SensorReading Table
- `id` (u64, primary key, auto-increment): Reading identifier
- `shipment_id` (u64): Reference to shipment
- `timestamp` (u64): Unix timestamp of reading
- `temperature` (f32): Temperature reading in Celsius

### Alert Table
- `id` (u64, primary key, auto-increment): Alert identifier
- `shipment_id` (u64): Reference to shipment
- `message` (String): Alert message
- `timestamp` (u64): Unix timestamp when alert was created

## 🔧 Available Commands

### Reducers (Functions)
- `create_shipment(id, name, status, min_temp, max_temp)`: Create a new shipment
- `process_sensor_reading(shipment_id, timestamp, temperature)`: Process temperature reading
- `get_shipment_status(shipment_id)`: Get shipment status

### SQL Queries
```bash
# View all shipments
spacetime sql supply-chain "SELECT * FROM shipment"

# View all sensor readings
spacetime sql supply-chain "SELECT * FROM sensor_reading"

# View all alerts
spacetime sql supply-chain "SELECT * FROM alert"

# View readings for a specific shipment
spacetime sql supply-chain "SELECT * FROM sensor_reading WHERE shipment_id = 1"
```

### Logs
```bash
spacetime logs supply-chain
```

## 📁 Project Structure

```
hophacks/
├── supply-chain/           # SpacetimeDB module
│   ├── src/
│   │   └── lib.rs         # Main module code
│   └── Cargo.toml         # Rust dependencies
├── lib.rs                 # Original module code
├── README.md              # This file
└── .gitignore            # Git ignore rules
```

## 🌡️ Example Usage

1. **Create a cold chain shipment:**
   ```bash
   spacetime call supply-chain create_shipment 1 "Vaccines" "In Transit" -20.0 -10.0
   ```

2. **Monitor temperature:**
   ```bash
   # Normal temperature
   spacetime call supply-chain process_sensor_reading 1 1640995200 -15.0
   
   # Temperature excursion (triggers alert)
   spacetime call supply-chain process_sensor_reading 1 1640995260 -5.0
   ```

3. **Check alerts:**
   ```bash
   spacetime sql supply-chain "SELECT * FROM alert WHERE shipment_id = 1"
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [SpacetimeDB Documentation](https://spacetimedb.com/docs)
- [SpacetimeDB Discord](https://discord.gg/spacetimedb)
- [Rust Documentation](https://doc.rust-lang.org/)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or join the SpacetimeDB Discord community.
