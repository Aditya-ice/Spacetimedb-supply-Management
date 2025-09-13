import { SpacetimeDBClient } from '@clockworklabs/spacetimedb-sdk';

// Create SpacetimeDB client
const client = new SpacetimeDBClient('ws://localhost:3000', 'supply-chain');

// Connection state
let isConnected = false;

// Connect to SpacetimeDB
export const connectToSpacetimeDB = async () => {
    try {
        await client.connect();
        isConnected = true;
        console.log('Connected to SpacetimeDB');
        return true;
    } catch (error) {
        console.error('Failed to connect to SpacetimeDB:', error);
        return false;
    }
};

// Disconnect from SpacetimeDB
export const disconnectFromSpacetimeDB = () => {
    if (isConnected) {
        client.disconnect();
        isConnected = false;
        console.log('Disconnected from SpacetimeDB');
    }
};

// Create a shipment
export const createShipment = async (id, name, status, minTemp, maxTemp) => {
    if (!isConnected) {
        throw new Error('Not connected to SpacetimeDB');
    }

    try {
        await client.call('create_shipment', [id, name, status, minTemp, maxTemp]);
        console.log('Shipment created successfully');
    } catch (error) {
        console.error('Failed to create shipment:', error);
        throw error;
    }
};

// Process sensor reading
export const processSensorReading = async (shipmentId, timestamp, temperature) => {
    if (!isConnected) {
        throw new Error('Not connected to SpacetimeDB');
    }

    try {
        await client.call('process_sensor_reading', [shipmentId, timestamp, temperature]);
        console.log('Sensor reading processed successfully');
    } catch (error) {
        console.error('Failed to process sensor reading:', error);
        throw error;
    }
};

// Get shipment status
export const getShipmentStatus = async (shipmentId) => {
    if (!isConnected) {
        throw new Error('Not connected to SpacetimeDB');
    }

    try {
        await client.call('get_shipment_status', [shipmentId]);
        console.log('Shipment status retrieved successfully');
    } catch (error) {
        console.error('Failed to get shipment status:', error);
        throw error;
    }
};

// Subscribe to table updates
export const subscribeToShipments = (callback) => {
    if (!isConnected) {
        throw new Error('Not connected to SpacetimeDB');
    }

    return client.subscribe('SELECT * FROM shipment', callback);
};

export const subscribeToSensorReadings = (callback) => {
    if (!isConnected) {
        throw new Error('Not connected to SpacetimeDB');
    }

    return client.subscribe('SELECT * FROM sensor_reading', callback);
};

export const subscribeToAlerts = (callback) => {
    if (!isConnected) {
        throw new Error('Not connected to SpacetimeDB');
    }

    return client.subscribe('SELECT * FROM alert', callback);
};

// Get connection status
export const getConnectionStatus = () => isConnected;

// Export the client for direct access if needed
export { client };
