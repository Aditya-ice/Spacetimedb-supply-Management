use spacetimedb::{ReducerContext, Table};

#[spacetimedb::table(name = shipment)]
pub struct Shipment {
    #[primary_key]
    pub id: u64,
    pub name: String,
    pub status: String,
    pub min_temp: f32,
    pub max_temp: f32,
}

#[spacetimedb::table(name = sensor_reading)]
pub struct SensorReading {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub shipment_id: u64,
    pub timestamp: u64,
    pub temperature: f32,
}

#[spacetimedb::table(name = alert)]
pub struct Alert {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    pub shipment_id: u64,
    pub message: String,
    pub timestamp: u64,
}

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    // Called when the module is initially published
    log::info!("Supply Chain Management Module initialized!");
}

#[spacetimedb::reducer]
pub fn create_shipment(ctx: &ReducerContext, id: u64, name: String, status: String, min_temp: f32, max_temp: f32) {
    let shipment_name = name.clone();
    ctx.db.shipment().insert(Shipment {
        id,
        name,
        status,
        min_temp,
        max_temp,
    });
    log::info!("Created shipment: {} with ID: {}", shipment_name, id);
}

#[spacetimedb::reducer]
pub fn process_sensor_reading(ctx: &ReducerContext, shipment_id: u64, timestamp: u64, temperature: f32) {
    // First, find the shipment this reading belongs to.
    let shipment = ctx.db.shipment().iter().find(|s| s.id == shipment_id);
    
    if let Some(shipment) = shipment {
        // Insert the new sensor reading into the table.
        ctx.db.sensor_reading().insert(SensorReading {
            id: 0, // autoinc will handle this
            shipment_id,
            timestamp,
            temperature,
        });

        // Check if the temperature is out of bounds.
        if temperature < shipment.min_temp || temperature > shipment.max_temp {
            // If it is, create a new alert!
            ctx.db.alert().insert(Alert {
                id: 0, // autoinc will handle this
                shipment_id,
                message: format!("ALERT: Temperature excursion! Current: {}°C", temperature),
                timestamp,
            });
            log::warn!("Temperature alert for shipment {}: {}°C", shipment_id, temperature);
        } else {
            log::info!("Normal temperature reading for shipment {}: {}°C", shipment_id, temperature);
        }
    } else {
        log::error!("Shipment not found with ID: {}", shipment_id);
    }
}

#[spacetimedb::reducer]
pub fn get_shipment_status(ctx: &ReducerContext, shipment_id: u64) {
    if let Some(shipment) = ctx.db.shipment().iter().find(|s| s.id == shipment_id) {
        log::info!("Shipment {}: {} - Status: {}", shipment.id, shipment.name, shipment.status);
    } else {
        log::error!("Shipment not found with ID: {}", shipment_id);
    }
}