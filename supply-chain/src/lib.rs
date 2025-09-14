use spacetimedb::{reducer, table, ReducerContext, SpacetimeType, Table, Timestamp};

#[derive(SpacetimeType, Clone, Debug)]
pub struct LatLongLocation {
    pub latitude: f64,
    pub longitude: f64,
}

// ---------- Tables ----------

#[table(name = shipment, public)]
pub struct Shipment {
    #[primary_key]
    pub id: i32,
    pub content: String,
    pub status: String, // "unassigned" | "in transit" | "delayed" | "delivered"
    pub min_temp: f32,
    pub max_temp: f32,
    pub current_temp: Option<f32>,
    pub start_location: LatLongLocation,
    pub current_location: LatLongLocation,
    pub end_location: LatLongLocation,
    pub sender_information: String,
    pub receiver_information: String,
    pub timestamp: Timestamp, // ms since epoch
    pub assigned_driver_id: Option<u64>,
}

#[table(name = sensor_reading, public)]
pub struct SensorReading {
    #[primary_key]
    pub id: i64, // auto-like: use timestamp+shipment to make unique if desired
    pub shipment_id: i32,
    pub timestamp: Timestamp,
    pub temperature: f32,
}

#[table(name = alert, public)]
pub struct Alert {
    #[primary_key]
    pub id: i64,
    pub shipment_id: i32,
    pub timestamp: Timestamp,
    pub message: String,
}

#[table(name = driver, public)]
pub struct Transporter {
    #[primary_key]
    pub id: u64,
    pub status: String, // "idle" | "busy" | "off-duty"
    pub current_location: LatLongLocation,
    pub timestamp: Timestamp,
}

// ---------- Reducers ----------

#[reducer]
pub fn create_shipment(
    ctx: &ReducerContext,
    id: i32,
    content: String,
    min_temp: f32,
    max_temp: f32,
    start_location: LatLongLocation,
    end_location: LatLongLocation,
    sender_information: String,
    receiver_information: String,
) -> Result<(), String> {
    if ctx.db.shipment().id().find(id).is_some() {
        return Err(format!("shipment {id} already exists"));
    }
    ctx.db.shipment().insert(Shipment {
        id,
        content,
        status: "unassigned".to_string(),
        min_temp,
        max_temp,
        current_temp: None,
        current_location: start_location.clone(),
        start_location,
        end_location,
        sender_information,
        receiver_information,
        timestamp: ctx.timestamp,
        assigned_driver_id: None,
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
pub fn create_driver(
    ctx: &ReducerContext,
    id: u64,
    status: String,
    current_location: LatLongLocation,
) -> Result<(), String> {
    ctx.db.driver().insert(Transporter {
        id,
        status,
        current_location,
        timestamp: ctx.timestamp,
    });
    Ok(())
}

#[reducer]
pub fn assign_driver_to_shipment(
    ctx: &ReducerContext,
    shipment_id: i32,
    driver_id: u64,
) -> Result<(), String> {
    let Some(mut shipment) = ctx.db.shipment().id().find(shipment_id) else {
        return Err(format!("unknown shipment {shipment_id}"));
    };
    let Some(mut driver) = ctx.db.driver().id().find(driver_id) else {
        return Err(format!("unknown driver {driver_id}"));
    };

    shipment.assigned_driver_id = Some(driver_id);
    shipment.status = "in transit".to_string();
    driver.status = "busy".to_string();

    ctx.db.shipment().id().update(shipment);
    ctx.db.driver().id().update(driver);

    log::info!("Assigned driver {} to shipment {}", driver_id, shipment_id);

    Ok(())
}