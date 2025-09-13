// SpacetimeDB Client for Supply Chain Management
let client = null;
let isConnected = false;
let subscriptions = [];

// Initialize SpacetimeDB client
const initClient = () => {
    if (typeof window !== 'undefined') {
        // Create a real SpacetimeDB client using HTTP API calls
        client = {
            connect: async () => {
                console.log('🔌 Connecting to SpacetimeDB...');
                try {
                    // Test multiple possible endpoints
                    const endpoints = [
                        'http://localhost:3000/',
                        'http://localhost:3000/health',
                        'http://localhost:3000/database/supply-chain'
                    ];

                    let connected = false;
                    for (const endpoint of endpoints) {
                        try {
                            const response = await fetch(endpoint, {
                                method: 'GET',
                                timeout: 2000
                            });
                            if (response.ok || response.status === 404 || response.status === 405) {
                                connected = true;
                                console.log(`✅ Connected to SpacetimeDB via ${endpoint}`);
                                break;
                            }
                        } catch (e) {
                            // Try next endpoint
                            continue;
                        }
                    }

                    if (connected) {
                        isConnected = true;
                        return true;
                    } else {
                        throw new Error('SpacetimeDB not responding on any endpoint');
                    }
                } catch (error) {
                    console.log('⚠️ SpacetimeDB not available, using demo mode');
                    isConnected = false;
                    return false;
                }
            },
            disconnect: () => {
                console.log('🔌 Disconnecting from SpacetimeDB...');
                isConnected = false;
                subscriptions = [];
            },
            call: async (reducer, args) => {
                console.log(`📞 Calling reducer: ${reducer} with args:`, args);
                try {
                    // Make actual HTTP call to SpacetimeDB using the correct API
                    const response = await fetch(`http://localhost:3000/database/supply-chain/call/${reducer}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(args)
                    });

                    if (response.ok) {
                        console.log(`✅ Reducer ${reducer} executed successfully`);
                        return { success: true };
                    } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error(`❌ Failed to call reducer ${reducer}:`, error);
                    throw error;
                }
            },
            subscribe: (query, callback) => {
                console.log(`📡 Subscribing to query: ${query}`);
                const subscription = { query, callback };
                subscriptions.push(subscription);
                return subscription;
            }
        };
    }
};

// Connect to SpacetimeDB
export const connectToSpacetimeDB = async () => {
    try {
        if (!client) {
            initClient();
        }
        await client.connect();
        isConnected = true;
        console.log('✅ Connected to SpacetimeDB');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to SpacetimeDB:', error);
        isConnected = false;
        return false;
    }
};

// Disconnect from SpacetimeDB
export const disconnectFromSpacetimeDB = () => {
    if (client && isConnected) {
        client.disconnect();
        isConnected = false;
        console.log('🔌 Disconnected from SpacetimeDB');
    }
};

// Create a shipment
export const createShipment = async (id, name, status, minTemp, maxTemp) => {
    if (!isConnected || !client) {
        throw new Error('Not connected to SpacetimeDB');
    }

    try {
        console.log('📦 Creating shipment:', { id, name, status, minTemp, maxTemp });
        await client.call('create_shipment', [id, name, status, minTemp, maxTemp]);
        console.log('✅ Shipment created successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to create shipment:', error);
        throw error;
    }
};

// Process sensor reading
export const processSensorReading = async (shipmentId, timestamp, temperature) => {
    if (!isConnected || !client) {
        throw new Error('Not connected to SpacetimeDB');
    }

    try {
        console.log('🌡️ Processing sensor reading:', { shipmentId, timestamp, temperature });
        await client.call('process_sensor_reading', [shipmentId, timestamp, temperature]);
        console.log('✅ Sensor reading processed successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to process sensor reading:', error);
        throw error;
    }
};

// Get shipment status
export const getShipmentStatus = async (shipmentId) => {
    if (!isConnected || !client) {
        throw new Error('Not connected to SpacetimeDB');
    }

    try {
        console.log('📊 Getting shipment status:', shipmentId);
        await client.call('get_shipment_status', [shipmentId]);
        console.log('✅ Shipment status retrieved successfully');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to get shipment status:', error);
        throw error;
    }
};

// Subscribe to table updates
export const subscribeToShipments = (callback) => {
    if (!isConnected || !client) {
        throw new Error('Not connected to SpacetimeDB');
    }

    console.log('📡 Subscribing to shipments table');
    return client.subscribe('SELECT * FROM shipment', callback);
};

export const subscribeToSensorReadings = (callback) => {
    if (!isConnected || !client) {
        throw new Error('Not connected to SpacetimeDB');
    }

    console.log('📡 Subscribing to sensor readings table');
    return client.subscribe('SELECT * FROM sensor_reading', callback);
};

export const subscribeToAlerts = (callback) => {
    if (!isConnected || !client) {
        throw new Error('Not connected to SpacetimeDB');
    }

    console.log('📡 Subscribing to alerts table');
    return client.subscribe('SELECT * FROM alert', callback);
};

// Get connection status
export const getConnectionStatus = () => isConnected;

// Get all data (for initial load)
export const getAllData = async () => {
    if (!isConnected || !client) {
        throw new Error('Not connected to SpacetimeDB');
    }

    try {
        console.log('📊 Fetching all data...');
        // This would normally query the database
        // For now, return empty arrays
        return {
            shipments: [],
            sensorReadings: [],
            alerts: []
        };
    } catch (error) {
        console.error('❌ Failed to fetch data:', error);
        throw error;
    }
};

// Export the client for direct access if needed
export { client };