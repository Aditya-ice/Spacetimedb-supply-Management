use spacetimedb::{spacetimedb, SpacetimeDB};

#[spacetimedb(table)]
pub struct Shipment {
    #[primarykey]
    pub id: u64,
    pub name: String,
    pub status: String,
    pub min_temp: f32,
    pub max_temp: f32,
}

#[spacetimedb(table)]
pub struct SensorReading {
    #[primarykey]
    #[autoinc]
    pub id: u64,
    pub shipment_id: u64,
    pub timestamp: u64,
    pub temperature: f32,
}

#[spacetimedb(table)]
pub struct Alert {
    #[primarykey]
    #[autoinc]
    pub id: u64,
    pub shipment_id: u64,
    pub message: String,
    pub timestamp: u64,
}

#[spacetimedb(reducer)]
pub fn process_sensor_reading(ctx: spacetimedb::Context, shipment_id: u64, timestamp: u64, temperature: f32) -> Result<(), String> {
    // First, find the shipment this reading belongs to.
    let shipment = Shipment::filter_by_id(&ctx, shipment_id).ok_or("Shipment not found".to_string())?;

    // Insert the new sensor reading into the table.
    SensorReading::insert(SensorReading {
        id: 0, // autoinc will handle this
        shipment_id,
        timestamp,
        temperature,
    })?;

    // Check if the temperature is out of bounds.
    if temperature < shipment.min_temp || temperature > shipment.max_temp {
        // If it is, create a new alert!
        Alert::insert(Alert {
            id: 0, // autoinc will handle this
            shipment_id,
            message: format!("ALERT: Temperature excursion! Current: {}°C", temperature),
            timestamp,
        })?;
    }

    Ok(())
}