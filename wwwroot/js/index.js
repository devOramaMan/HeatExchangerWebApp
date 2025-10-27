// Import WebPubSubClient at the top (ES module import)
let WebPubSubClientClass = null;

// Data source mode
let dataSourceMode = 'AzureWebPubSub'; // Default mode
let webPubSubClient = null;
const dataSourceForm = document.getElementById('dataSourceForm');
const dataSourceStatus = document.getElementById('dataSourceStatus');
const dataSourceRadios = document.querySelectorAll('input[name="dataSource"]');

// Reconnection variables
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;
let reconnectDelay = 2000; // Start with 2 seconds
let reconnectTimeout = null;

// Add event listeners to all radio buttons
dataSourceRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
        dataSourceMode = e.target.value;
        await updateDataSourceStatus();
    });
});

async function updateDataSourceStatus() {
    switch(dataSourceMode) {
        case 'Simulator':
            dataSourceStatus.textContent = 'Mode: Simulator Only';
            dataSourceStatus.style.color = '#6566';
            // Disconnect Web PubSub if connected
            if (webPubSubClient) {
                await disconnectWebPubSub();
            }
            break;
        case 'PostGres':
            dataSourceStatus.textContent = 'Mode: PostgreSQL Database (Simulator → DB → UI)';
            dataSourceStatus.style.color = '#2e7d32';
            // Disconnect Web PubSub if connected
            if (webPubSubClient) {
                await disconnectWebPubSub();
            }
            break;
        case 'AzureWebPubSub':
            dataSourceStatus.textContent = 'Mode: Azure Web PubSub - Connecting...';
            dataSourceStatus.style.color = '#1976d2';
            await connectWebPubSub();
            break;
    }
}

function scheduleReconnect() {
    // Clear any existing reconnect timeout
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    // Check if we should still attempt reconnection
    if (dataSourceMode !== 'AzureWebPubSub') {
        console.log('Data source mode changed - cancelling reconnection');
        reconnectAttempts = 0;
        return;
    }

    if (reconnectAttempts >= maxReconnectAttempts) {
        console.log('Max reconnect attempts reached - giving up');
        dataSourceStatus.textContent = 'Mode: Azure Web PubSub - Connection Failed (max attempts reached)';
        dataSourceStatus.style.color = '#d32f2f';
        reconnectAttempts = 0;
        return;
    }

    // Calculate delay with exponential backoff
    const currentDelay = reconnectDelay * Math.pow(1.5, reconnectAttempts);
    const maxDelay = 30000; // Max 30 seconds
    const actualDelay = Math.min(currentDelay, maxDelay);

    console.log(`Scheduling reconnect in ${actualDelay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);

    reconnectTimeout = setTimeout(async () => {
        reconnectAttempts++;
        console.log(`Reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
        
        try {
            await connectWebPubSub();
        } catch (error) {
            console.error('Reconnection failed:', error.message);
            // scheduleReconnect will be called by onclose event if connection fails
        }
    }, actualDelay);
}

async function connectWebPubSub() {
    try {
        console.log('=== STARTING AZURE WEB PUBSUB CONNECTION ===');
        console.log('Time:', new Date().toISOString());
        console.log('Data source mode:', dataSourceMode);
        console.log('Reconnect attempt:', reconnectAttempts);
        
        // Get access token from server (similar to Node.js subscriber)
        console.log('Step 1: Fetching access token from /api/WebPubSub/negotiate...');
        const userId = 'browser_' + Date.now();
        
        const response = await fetch('/api/WebPubSub/negotiate?userId=' + userId);
        
        console.log('Step 2: Response received');
        console.log('Response status:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('NEGOTIATE FAILED');
            console.error('Status:', response.status);
            console.error('Error text:', errorText);
            throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('Step 3: Negotiate response parsed');
        
        const tokenUrl = result.Url || result.url;
        
        if (!tokenUrl) {
            console.error('NO TOKEN URL');
            throw new Error('No connection URL received from server');
        }

        console.log('Step 4: Creating WebSocket connection...');
        
        // Create WebSocket connection (exactly like Node.js subscriber)
        webPubSubClient = new WebSocket(tokenUrl);
        
        webPubSubClient.onopen = () => {
            console.log('WEBSOCKET CONNECTED!');
            console.log('Connection time:', new Date().toISOString());
            console.log('WebSocket ready state:', webPubSubClient.readyState);
            
            // Reset reconnection state on successful connection
            reconnectAttempts = 0;
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                reconnectTimeout = null;
            }
            
            dataSourceStatus.textContent = 'Mode: Azure Web PubSub - Connected';
            dataSourceStatus.style.color = '#2e7d32';
            console.log('Connection successful - reconnection state reset');
        };
        
        webPubSubClient.onmessage = (event) => {
            console.log('RAW MESSAGE RECEIVED');
            console.log('Time:', new Date().toISOString());
            console.log('Raw event.data:', event.data);
            console.log('Data type:', typeof event.data);
            console.log('Data length:', event.data.length);
            
            try {
                const raw = JSON.parse(event.data);
                let message = raw;
                
                if (typeof raw == 'string') {
                    message = JSON.parse(raw);                
                }
                
                console.log('PARSED MESSAGE:', message);
                console.log('Message type:', message.type);
                
                // Handle temperature updates (same logic as subscriber.js)
                if (message.type == 'temperature_message' && message.data) {
                    console.log('TEMPERATURE MESSAGE DETECTED');
                    let temperatureData = message.data;

                    // Full temperature set
                    currentData.temp1 = parseFloat(temperatureData.temp1);
                    currentData.temp2 = parseFloat(temperatureData.temp2);
                    currentData.temp3 = parseFloat(temperatureData.temp3);
                    currentData.temp4 = parseFloat(temperatureData.temp4);

                    updateTemperatureDisplay();
                    updateEfficiency();
                    
                    console.info('TEMPERATURES UPDATED SUCCESSFULLY:', currentData);
                } else {
                    console.log('Non-temperature message:', message.type);
                }
            } catch (error) {
                console.error('ERROR PROCESSING MESSAGE:', error);
                console.error('Error stack:', error.stack);
                console.log('Trying to handle as plain text:', event.data);
            }
        };

        webPubSubClient.onclose = (event) => {
            console.log('CONNECTION CLOSED');
            console.log('Time:', new Date().toISOString());
            console.log('Close code:', event.code);
            console.log('Close reason:', event.reason);
            console.log('Was clean:', event.wasClean);
            console.log('Data source mode:', dataSourceMode);
            
            if (dataSourceMode === 'AzureWebPubSub') {
                if (event.code === 1000) {
                    dataSourceStatus.textContent = 'Mode: Azure Web PubSub - Disconnected';
                    console.log('Normal disconnection');
                    // Reset reconnect attempts on normal closure
                    reconnectAttempts = 0;
                } else if (event.code === 1006) {
                    // 1006 = Abnormal closure, try to reconnect
                    console.log('Abnormal disconnection (1006) - attempting reconnection...');
                    dataSourceStatus.textContent = `Mode: Azure Web PubSub - Connection Lost (attempting reconnect ${reconnectAttempts + 1}/${maxReconnectAttempts})`;
                    scheduleReconnect();
                } else {
                    dataSourceStatus.textContent = `Mode: Azure Web PubSub - Error (${event.code})`;
                    console.log('Abnormal disconnection');
                    // Try to reconnect for other error codes too, but less aggressively
                    if (reconnectAttempts < maxReconnectAttempts) {
                        scheduleReconnect();
                    }
                }
                dataSourceStatus.style.color = '#d32f2f';
            }
        };
        
        webPubSubClient.onerror = (error) => {
            console.error('WEBSOCKET ERROR OCCURRED');
            console.error('Time:', new Date().toISOString());
            console.error('Error object:', error);
            console.error('Error type:', error.type);
            console.error('Error target:', error.target);
            
            dataSourceStatus.textContent = 'Mode: Azure Web PubSub - Connection Error';
            dataSourceStatus.style.color = '#d32f2f';
        };
        
    } catch (error) {
        console.error('CONNECTION SETUP FAILED');
        console.error('Time:', new Date().toISOString());
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', error);
        
        dataSourceStatus.textContent = 'Mode: Azure Web PubSub - Connection Failed';
        dataSourceStatus.style.color = '#d32f2f';
        alert('Failed to connect to Azure Web PubSub: ' + error.message);
    }
}

async function disconnectWebPubSub() {
    // Clear any pending reconnection attempts
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    reconnectAttempts = 0;
    
    if (webPubSubClient) {
        try {
            if (webPubSubClient.close) {
                webPubSubClient.close();
            }
            webPubSubClient = null;
            console.log('Disconnected from Web PubSub and cleared reconnection state');
        } catch (error) {
            console.error('Error disconnecting from Web PubSub:', error);
        }
    }
}

// Efficiency calculation
function calculateEfficiency() {
    const t1 = currentData.temp1; // T1: Outdoor Air In (Chamber 4)
    const t2 = currentData.temp2; // T2: Supply Air (Chamber 1)
    const t3 = currentData.temp3; // T3: Extract Air (Chamber 3)
    const t4 = currentData.temp4; // T4: Exhaust Air Out (Chamber 2)
    
    // Efficiency = (T2-T1)/(T3-T1) * 100
    if (t3 !== t1) {
        const efficiency = ((t2 - t1) / (t3 - t1)) * 100;
        return Math.max(0, Math.min(100, efficiency)); // Limit between 0-100%
    }
    return 0;
}

function updateEfficiency() {
    const efficiency = calculateEfficiency();
    document.getElementById('efficiencyValue').textContent = efficiency.toFixed(1) + '%';
    
    // Update chart
    updateChart(efficiency);
}

// Hardcoded data simulating data source fetch
let currentData = {
    temp1: 5.0,   // T1: Outdoor Air In (Chamber 4)
    temp2: 18.0,  // T2: Supply Air (Chamber 1) 
    temp3: 20.0,  // T3: Extract Air (Chamber 3)
    temp4: 8.0    // T4: Exhaust Air Out (Chamber 2)
};

// Simulates fetching data from API/database
async function fetchTemperatureData() {
    if (dataSourceMode === 'PostGres') {
        // Database mode: Write simulated data to DB, then read from DB
        const writeSuccess = await writeSimulatedDataToDB();
        if (writeSuccess) {
            // Small delay to ensure DB commit completes
            await new Promise(resolve => setTimeout(resolve, 50));
            await readDataFromDB();
        } else {
            console.warn('Skipping read due to write failure');
        }
    } else if (dataSourceMode === 'Simulator') {
        // Simulator mode: Generate and display data directly
        const baseValues = {
            temp1: 5.0,
            temp2: 18.0,
            temp3: 20.0,
            temp4: 8.0
        };

        // Add some random variation (±2 degrees)
        currentData.temp1 = baseValues.temp1 + (Math.random() - 0.5) * 4;
        currentData.temp2 = baseValues.temp2 + (Math.random() - 0.5) * 4;
        currentData.temp3 = baseValues.temp3 + (Math.random() - 0.5) * 4;
        currentData.temp4 = baseValues.temp4 + (Math.random() - 0.5) * 4;

        // Update display
        updateTemperatureDisplay();
        updateEfficiency();
    }
}

async function writeSimulatedDataToDB() {
    // Generate simulated data
    const baseValues = {
        temp1: 5.0,
        temp2: 18.0,
        temp3: 20.0,
        temp4: 8.0
    };

    const simulatedData = {
        temp1: baseValues.temp1 + (Math.random() - 0.5) * 4,
        temp2: baseValues.temp2 + (Math.random() - 0.5) * 4,
        temp3: baseValues.temp3 + (Math.random() - 0.5) * 4,
        temp4: baseValues.temp4 + (Math.random() - 0.5) * 4
    };

    const testData = {
        T1_Outdoor_Air_In_Temperature: simulatedData.temp1,
        T2_Supply_Air_Temperature: simulatedData.temp2,
        T3_Extract_Air_Temperature: simulatedData.temp3,
        T4_Exhaust_Air_Out_Temperature: simulatedData.temp4
    };

    try {
        const response = await fetch('/api/DatabaseTest/insert-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to write to database:', errorText);
            return false;
        }
        
        const result = await response.json();
        console.log('Successfully wrote to database:', result.Result?.Id);
        return true;
    } catch (error) {
        console.error('Failed to write to database:', error);
        return false;
    }
}

async function readDataFromDB() {
    try {
        console.log('Fetching readings from /api/DatabaseTest/readings...');
        const response = await fetch('/api/DatabaseTest/readings');
        console.log('Response status:', response.status, response.statusText);
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (response.ok && result.readings && result.readings.length > 0) {
            const latest = result.readings[0];
            console.log('Latest reading:', latest);
            
            currentData.temp1 = parseFloat(latest.t1_Outdoor_Air_In_Temperature);
            currentData.temp2 = parseFloat(latest.t2_Supply_Air_Temperature);
            currentData.temp3 = parseFloat(latest.t3_Extract_Air_Temperature);
            currentData.temp4 = parseFloat(latest.t4_Exhaust_Air_Out_Temperature);
            
            console.log('Updated currentData:', currentData);
            
            updateTemperatureDisplay();
            updateEfficiency();
            console.info('Successfully read data from database');
        }
        else{
            console.warn('No readings available from database. Response OK:', response.ok, 'Readings:', result.readings);
        }
    } catch (error) {
        console.error('Failed to read from database:', error);
    }
}

function updateTemperatureDisplay() {
    // Map temperature data to correct chamber positions
    document.getElementById('temp1').textContent = currentData.temp1.toFixed(1); // T1: Outdoor Air In (Chamber 4)
    document.getElementById('temp2').textContent = currentData.temp2.toFixed(1); // T2: Supply Air (Chamber 1)
    document.getElementById('temp3').textContent = currentData.temp3.toFixed(1); // T3: Extract Air (Chamber 3)
    document.getElementById('temp4').textContent = currentData.temp4.toFixed(1); // T4: Exhaust Air Out (Chamber 2)
}

// Chart setup
let chartData = {
    labels: [],
    datasets: [{
        label: 'Efficiency (%)',
        data: [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
    }]
};

const ctx = document.getElementById('efficiencyChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Efficiency (%)'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Time'
                }
            }
        },
        plugins: {
            title: {
                display: false,
                text: 'Heat Exchanger Efficiency'
            }
        }
    }
});

function updateChart(efficiency) {
    const now = new Date().toLocaleTimeString();
    chartData.labels.push(now);
    chartData.datasets[0].data.push(efficiency);
    
    // Keep only the last 20 data points
    if (chartData.labels.length > 20) {
        chartData.labels.shift();
        chartData.datasets[0].data.shift();
    }
    
    chart.update();
}

// Core rotation control
const coreElement = document.querySelector('.heat-exchanger-core');
const rotationToggle = document.getElementById('rotationToggle');
const rpmSlider = document.getElementById('rpmSlider');
const rpmValue = document.getElementById('rpmValue');

function updateRotation() {
    if (rotationToggle.checked) {
        const rpm = parseInt(rpmSlider.value);
        const rotationDuration = 60 / rpm; // Convert RPM to seconds per rotation
        
        coreElement.style.setProperty('--rotation-duration', rotationDuration + 's');
        coreElement.classList.add('rotating');
        
        // Update RPM display
        rpmValue.textContent = rpm;
    } else {
        coreElement.classList.remove('rotating');
    }
}

// Event listeners for rotation controls
rotationToggle.addEventListener('change', updateRotation);
rpmSlider.addEventListener('input', () => {
    rpmValue.textContent = rpmSlider.value;
    if (rotationToggle.checked) {
        updateRotation();
    }
});

// Initial setup - connect to Azure Web PubSub by default
async function initializeApplication() {
    // Set the correct radio button based on default mode
    const azureRadio = document.querySelector('input[value="AzureWebPubSub"]');
    if (azureRadio) {
        azureRadio.checked = true;
    }
    
    // Initialize data source
    await updateDataSourceStatus();
    
    // Start data fetching cycle
    fetchTemperatureData();
    
    // Simulate data fetching every 3 seconds (as if coming from sensors/API)
    setInterval(() => {
        fetchTemperatureData();
    }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeApplication);

// Database testing functions
async function testDatabaseConnection() {
    const statusElement = document.getElementById('dbStatus');
    statusElement.textContent = 'Testing connection...';
    statusElement.className = 'status-indicator testing';
    
    try {
        const response = await fetch('/api/DatabaseTest/test-connection');
        const result = await response.json();
        
        if (response.ok) {
            statusElement.textContent = `Connected - ${result.DatabaseInfo?.Database || 'Unknown DB'}`;
            statusElement.className = 'status-indicator success';
            console.log('Database Info:', result);
        } else {
            statusElement.textContent = `Failed - ${result.Message}`;
            statusElement.className = 'status-indicator error';
            console.error('Connection failed:', result);
        }
    } catch (error) {
        statusElement.textContent = `Error - ${error.message}`;
        statusElement.className = 'status-indicator error';
        console.error('Network error:', error);
    }
}

async function insertTestData() {
    const testData = {
        T1_Outdoor_Air_In_Temperature: currentData.temp1,
        T2_Supply_Air_Temperature: currentData.temp2,
        T3_Extract_Air_Temperature: currentData.temp3,
        T4_Exhaust_Air_Out_Temperature: currentData.temp4
    };

    try {
        const response = await fetch('/api/DatabaseTest/insert-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(`Data inserted successfully! ID: ${result.Result?.Id}`);
            console.log('Inserted data:', result);
        } else {
            alert(`Insert failed: ${result.Message}`);
            console.error('Insert failed:', result);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error('Network error:', error);
    }
}

async function getLatestReadings() {
    try {
        const response = await fetch('/api/DatabaseTest/readings');
        const result = await response.json();
        
        if (response.ok) {
            const readings = Array.isArray(result.readings) ? result.readings : [];
            console.log('Latest readings:', readings);

            if (readings.length === 0) {
                alert('No readings available yet.');
                return;
            }

            const readingsText = readings.map(r => 
                `${new Date(r.timestamp).toLocaleString()}: T1=${r.t1_Outdoor_Air_In_Temperature}°C T2=${r.t2_Supply_Air_Temperature}°C`
            ).join('\n');

            const count = typeof result.count === 'number' ? result.count : readings.length;
            alert(`Latest ${count} readings:\n\n${readingsText}`);
        } else {
            alert(`Failed to get readings: ${result.message || result.Message}`);
            console.error('Get readings failed:', result);
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
        console.error('Network error:', error);
    }
}

// Manual reconnection function for debugging
window.manualReconnectWebPubSub = function() {
    if (dataSourceMode === 'AzureWebPubSub') {
        console.log('Manual reconnection triggered');
        reconnectAttempts = 0; // Reset attempts
        connectWebPubSub();
    } else {
        console.log('Cannot reconnect - Azure Web PubSub not selected');
    }
};

// Debug function to check reconnection state
window.getReconnectionStatus = function() {
    return {
        dataSourceMode: dataSourceMode,
        reconnectAttempts: reconnectAttempts,
        maxReconnectAttempts: maxReconnectAttempts,
        hasReconnectTimeout: !!reconnectTimeout,
        webSocketState: webPubSubClient ? webPubSubClient.readyState : 'No connection'
    };
};

// Test database connection on page load
setTimeout(testDatabaseConnection, 1000);
