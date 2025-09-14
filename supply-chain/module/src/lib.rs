use spacetimedb::{reducer, table, ReducerContext, SpacetimeType, Table, Timestamp};

#[derive(SpacetimeType)]
pub struct LatLongLocation {
    latitude: f64,
    longitude: f64,
}

// ---------- Tables ----------

#[table(name = shipment, public)]
pub struct Shipment {
    #[primary_key]
    id: i32,
    content: String,
    status: String, // "processing" | "in transit" | "delayed" | "delivered"
    min_temp: f32,
    max_temp: f32,
    current_temp: Option<f32>,
    start_location: LatLongLocation,
    current_location: LatLongLocation,
    end_location: LatLongLocation,
    sender_information: String,
    receiver_information: String,
    timestamp: Timestamp, // ms since epoch
}

#[table(name = sensor_reading, public)]
pub struct SensorReading {
    #[primary_key]
    id: i64, // auto-like: use timestamp+shipment to make unique if desired
    shipment_id: i32,
    timestamp: Timestamp,
    temperature: f32,
}

#[table(name = alert, public)]
pub struct Alert {
    #[primary_key]
    id: i64,
    shipment_id: i32,
    timestamp: Timestamp,
    message: String,
}

// ---------- Reducers ----------

#[reducer]
pub fn create_shipment(
    ctx: &ReducerContext,
    id: i32,
    content: String,
    status: String,
    min_temp: f32,
    max_temp: f32,
    start_location: LatLongLocation,
    current_location: LatLongLocation,
    end_location: LatLongLocation,
    sender_information: String,
    receiver_information: String,
    timestamp: Timestamp,
) -> Result<(), String> {
    if ctx.db.shipment().id().find(id).is_some() {
        return Err(format!("shipment {id} already exists"));
    }
    ctx.db.shipment().insert(Shipment {
        id,
        content,
        status,
        min_temp,
        max_temp,
        current_temp: None,
        start_location,
        current_location,
        end_location,
        sender_information,
        receiver_information,
        timestamp,
    });
    Ok(())
}

#[reducer]
pub fn process_sensor_reading(
    ctx: &ReducerContext,
    shipment_id: i32,
    timestamp: Timestamp,
    temperature: f32,
) -> Result<(), String> {
    let Some(mut sh) = ctx.db.shipment().id().find(shipment_id) else {
        return Err(format!("unknown shipment {shipment_id}"));
    };
    // insert reading
    let rid = (timestamp.to_micros_since_unix_epoch()) << 8 | (shipment_id as i64 & 0xFF);
    ctx.db.sensor_reading().insert(SensorReading {
        id: rid,
        shipment_id,
        timestamp,
        temperature,
    });
    // update current temp
    sh.current_temp = Some(temperature);
    let sh = ctx.db.shipment().id().update(sh);

    // emit alert if out of range
    if temperature < sh.min_temp || temperature > sh.max_temp {
        let msg = format!(
            "Temperature out of range: {temperature}°C (allowed {}–{}°C)",
            sh.min_temp, sh.max_temp
        );
        let aid = (timestamp.to_micros_since_unix_epoch()) << 8 | (shipment_id as i64 & 0xFF);
        ctx.db.alert().insert(Alert {
            id: aid,
            shipment_id,
            timestamp,
            message: msg,
        });
    }
    Ok(())
}

#[reducer]
pub fn get_shipment_status(ctx: &ReducerContext, shipment_id: i32) -> Result<(), String> {
    if ctx.db.shipment().id().find(shipment_id).is_none() {
        return Err(format!("unknown shipment {shipment_id}"));
    }
    // No-op reducer (kept for parity with your UI). Could compute/return more info if desired.
    Ok(())
}