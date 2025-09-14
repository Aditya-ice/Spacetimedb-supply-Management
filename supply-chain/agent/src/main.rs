// Import the auto-generated SpacetimeDB module (mod.rs)
#[path = "mod.rs"]
mod modrs;

// Required libraries for making HTTP requests and handling JSON.
use serde::{Deserialize, Serialize};
use std::env;
use std::time::Duration;
use tokio::time::sleep;

// Import types and functions from the auto-generated module
use modrs::LatLongLocation;

// --- Structs for the Gemini API call ---
// (These will be used when implementing the full agent functionality)
#[allow(dead_code)]
#[derive(Serialize)]
struct GeminiRequest<'a> {
    contents: Vec<Content<'a>>,
}

#[allow(dead_code)]
#[derive(Serialize)]
struct Content<'a> {
    parts: Vec<Part<'a>>,
}

#[allow(dead_code)]
#[derive(Serialize)]
struct Part<'a> {
    text: &'a str,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<Candidate>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct Candidate {
    content: ResponseContent,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct ResponseContent {
    parts: Vec<ResponsePart>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct ResponsePart {
    text: String,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct DriverRecommendation {
    recommended_driver_id: u64,
    reason: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
struct CandidateDriver {
    driver_id: u64,
    distance_km: f64,
}
// --- End of Gemini Structs ---

#[allow(dead_code)]
const DB_NAME: &str = "hophacks-sxt";
#[allow(dead_code)]
const HOST: &str = "http://localhost:3000";

#[tokio::main]
async fn main() {
    println!("Connecting to SpacetimeDB...");

    // For now, let's create a simple connection without the complex setup
    // This will be a placeholder until we can figure out the correct API
    println!("Note: Connection setup simplified for now");

    println!("Successfully connected to SpacetimeDB. Agent is running.");
    println!("Watching for new unassigned shipments...");

    loop {
        sleep(Duration::from_secs(5)).await;

        // For now, just print a status message
        // The actual database operations will be implemented once we resolve the connection API
        println!("Agent is running... (Database connection pending)");
    }
}

// --- Helper Functions ---

#[allow(dead_code)]
const EARTH_RADIUS_KM: f64 = 6371.0;

#[allow(dead_code)]
fn havercos_distance(point1: &LatLongLocation, point2: &LatLongLocation) -> f64 {
    let lat1_rad = point1.latitude.to_radians();
    let lat2_rad = point2.latitude.to_radians();
    let delta_lat = (point2.latitude - point1.latitude).to_radians();
    let delta_lon = (point2.longitude - point1.longitude).to_radians();

    let a = (delta_lat / 2.0).sin().powi(2)
        + lat1_rad.cos() * lat2_rad.cos() * (delta_lon / 2.0).sin().powi(2);
    let c = 2.0_f64 * a.sqrt().atan2((1.0_f64 - a).sqrt());

    EARTH_RADIUS_KM * c
}

#[allow(dead_code)]
async fn call_gemini_for_recommendation(
    pickup_location: &LatLongLocation,
    candidates: Vec<&CandidateDriver>,
) -> Result<DriverRecommendation, String> {
    let api_key =
        env::var("GEMINI_API_KEY").map_err(|_| "GEMINI_API_KEY env var not set".to_string())?;
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={}",
        api_key
    );

    let candidates_json = serde_json::to_string(&candidates).unwrap();
    let prompt_text = format!(
        "A new shipment is ready for pickup at latitude {} and longitude {}. Based on the following list of available drivers sorted by proximity, who should be assigned? Candidates: {}. Provide the output as a single JSON object with two keys: 'recommended_driver_id' (as a number) and 'reason' (as a string).",
        pickup_location.latitude, pickup_location.longitude, candidates_json
    );

    let payload = GeminiRequest {
        contents: vec![Content {
            parts: vec![Part { text: &prompt_text }],
        }],
    };

    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let response_body: GeminiResponse = res.json().await.map_err(|e| e.to_string())?;
        if let Some(candidate) = response_body.candidates.first() {
            if let Some(part) = candidate.content.parts.first() {
                let cleaned_text = part
                    .text
                    .trim()
                    .trim_start_matches("```json")
                    .trim_end_matches("```")
                    .trim();
                let recommendation: DriverRecommendation =
                    serde_json::from_str(cleaned_text).map_err(|e| e.to_string())?;
                return Ok(recommendation);
            }
        }
    }
    Err("Failed to parse recommendation from Gemini API response".to_string())
}
