const WebSocket = require('ws');
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

const hub = secrets.AZURE_WEBPUBSUB_HUB_NAME; // Match the hub name in your controller
const connectionString = secrets.AZURE_WEBPUBSUB_CONNECTION_STRING;

if (!connectionString) {
    console.error('AZURE_WEBPUBSUB_CONNECTION_STRING not found in secrets.json');
    console.error('Make sure it is configured in the secrets.json file');
    process.exit(1);
}

function handleConnectionClose(code, reason) {
    console.log('Connection closed:', code, reason.toString());
    
    // Only log the closure, don't automatically reconnect
    // Reconnection should only happen when explicitly requested
    // (e.g., when user switches back to Azure Web PubSub mode)
    if (code === 1000) {
        console.log('Normal closure - connection terminated intentionally');
    } else {
        console.log('Abnormal closure - connection may have been lost');
        console.log('Manual reconnection required or switch data source mode');
    }
}

async function startSubscriber() {
    try {
        console.log('Starting Azure Web PubSub subscriber...');
        console.log('Hub:', hub);
        
        // Create service client and get access token (like your working example)
        let serviceClient = new WebPubSubServiceClient(connectionString, hub);
        let token = await serviceClient.getClientAccessToken();
        
        console.log('Got access token, connecting... %s', connectionString);
        
        // Create WebSocket connection (like your working example)
        let ws = new WebSocket(token.url);
        
        ws.on('open', () => {
            console.log('Connected to Azure Web PubSub!');
            
            // // Join the temperature group
            // const joinMessage = {
            //     type: 'joinGroup',
            //     group: 'temperature'
            // };
            // ws.send(JSON.stringify(joinMessage));
            console.log('Joined temperature group');
        });
        
        ws.on('message', data => {
            try {
                const message = JSON.parse(data.toString());
                console.log('Message received:', message);
                
                // If it's temperature data, parse and display it
                if (message.type === 'message' && message.data) {
                    let tempData;
                    if (typeof message.data === 'string') {
                        tempData = JSON.parse(message.data);
                    } else {
                        tempData = message.data;
                    }
                    
                    if (tempData.temp1 !== undefined) {
                        console.log(`Temperatures - T1: ${tempData.temp1.toFixed(1)}°C, T2: ${tempData.temp2.toFixed(1)}°C, T3: ${tempData.temp3.toFixed(1)}°C, T4: ${tempData.temp4.toFixed(1)}°C`);
                    }
                }
            } catch (error) {
                console.log('Raw message:', data.toString());
            }
        });
        
        ws.on('close', handleConnectionClose);
        
        ws.on('error', (error) => {
            console.error('WebSocket error:', error.message);
        });
        
    } catch (error) {
        console.error('Failed to start subscriber:', error.message);
    }
}

// Start the subscriber
startSubscriber();

console.log('Subscriber started. Press Ctrl+C to stop.');