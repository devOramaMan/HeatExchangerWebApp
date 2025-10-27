const { WebPubSubServiceClient } = require('@azure/web-pubsub');
const fs = require('fs');
const path = require('path');

// Load secrets from secrets.json (same as ASP.NET Core app)
const secretsPath = path.join(__dirname, '..', 'secrets.json');
let secrets = {};

try {
    const secretsData = fs.readFileSync(secretsPath, 'utf8');
    secrets = JSON.parse(secretsData);
} catch (error) {
    console.error('Failed to load secrets.json:', error.message);
    process.exit(1);
}

const hub = secrets.AZURE_WEBPUBSUB_HUB_NAME
const connectionString = secrets.AZURE_WEBPUBSUB_CONNECTION_STRING;

if (!connectionString) {
    console.error('AZURE_WEBPUBSUB_CONNECTION_STRING not found in secrets.json');
    console.error('Make sure it is configured in the secrets.json file');
    process.exit(1);
}

async function publishTemperatureData() {
    try {
        let serviceClient = new WebPubSubServiceClient(connectionString, hub);
        
        // Simulate temperature data (like your example)
        const temperatureData = {
            data: {
                temp1: 5.0 + (Math.random() - 0.5) * 4,
                temp2: 18.0 + (Math.random() - 0.5) * 4,
                temp3: 20.0 + (Math.random() - 0.5) * 4,
                temp4: 8.0 + (Math.random() - 0.5) * 4,
                timestamp: new Date().toISOString(),
            },
            type: 'temperature_message'
        };
        
        console.log('Publishing temperature data:', temperatureData);
        
        // Send to all connected clients
        await serviceClient.sendToAll(JSON.stringify(temperatureData), { contentType: "application/json" });
        
        console.log('Temperature data sent successfully!');
        
    } catch (error) {
        console.error('Failed to publish temperature data:', error.message);
    }
}

// Publish data every 5 seconds
console.log('Starting temperature data publisher...');
console.log('Hub:', hub);
console.log('Connection string configured:', !!connectionString);

// Send initial data
publishTemperatureData();

// Send data every 5 seconds
setInterval(publishTemperatureData, 5000);

console.log('Publisher started. Press Ctrl+C to stop.');