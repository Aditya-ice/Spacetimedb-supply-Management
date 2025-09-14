use spacetimedb::{spacetimedb, SpacetimeDB};

#[spacetimedb(table)]
pub struct Shipment {
    #[primarykey]
    pub id: u64,
    pub name: String,
    pub status: String,
    pub min_temp: f32,
    pub max_temp: f32,
    pub current_location: String,   // e.g. "40.7128,-74.0060"
    pub current_temp: Option<f32>,  // nullable for popup
    pub timestamp: u64,             // unix timestamp (secs)
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
pub fn create_shipment(
    _ctx: spacetimedb::Context,
    id: u64,
    name: String,
    status: String,
    min_temp: f32,
    max_temp: f32,
    current_location: String,
    timestamp: u64,
) -> Result<(), String> {
    Shipment::insert(Shipment {
        id,
        name,
        status,
        min_temp,
        max_temp,
        current_location,
        current_temp: None,
        timestamp,
    })?;
    Ok(())
}

#[spacetimedb(reducer)]
pub fn update_shipment_location(
    ctx: spacetimedb::Context,
    shipment_id: u64,
    current_location: String,
    timestamp: u64,
) -> Result<(), String> {
    let mut shipment = Shipment::filter_by_id(&ctx, shipment_id)
        .ok_or("Shipment not found".to_string())?;

    shipment.current_location = current_location;
    shipment.timestamp = timestamp;

    Shipment::update(&shipment)?;
    Ok(())
}

#[spacetimedb(reducer)]
pub fn process_sensor_reading(
    ctx: spacetimedb::Context,
    shipment_id: u64,
    timestamp: u64,
    temperature: f32,
) -> Result<(), String> {
    let mut shipment = Shipment::filter_by_id(&ctx, shipment_id)
        .ok_or("Shipment not found".to_string())?;

    // update live temp for frontend
    shipment.current_temp = Some(temperature);
    shipment.timestamp = timestamp;
    Shipment::update(&shipment)?;

    // insert historical record
    SensorReading::insert(SensorReading {
        id: 0,
        shipment_id,
        timestamp,
        temperature,
    })?;

    // raise alert if outside range
    if temperature < shipment.min_temp || temperature > shipment.max_temp {
        Alert::insert(Alert {
            id: 0,
            shipment_id,
            message: format!("ALERT: Temperature excursion! Current: {}°C", temperature),
            timestamp,
        })?;
    }

    Ok(())
}
