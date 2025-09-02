// Keep-alive script to ping the backend API every 5 minutes
// This prevents Render free tier from sleeping the service

const API_URL = 'https://mizzou-baseball-dashboard-api.onrender.com';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function pingAPI() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const timestamp = new Date().toISOString();

        if (response.ok) {
            console.log(`✅ [${timestamp}] API ping successful - Status: ${response.status}`);
        } else {
            console.log(`⚠️ [${timestamp}] API ping failed - Status: ${response.status}`);
        }
    } catch (error) {
        const timestamp = new Date().toISOString();
        console.log(`❌ [${timestamp}] API ping error:`, error.message);
    }
}

// Start the keep-alive service
console.log('🚀 Starting Mizzou Baseball API keep-alive service...');
console.log(`📡 Pinging ${API_URL}/health every ${PING_INTERVAL / 1000 / 60} minutes`);

// Initial ping
pingAPI();

// Set up interval pings
setInterval(pingAPI, PING_INTERVAL);

// Keep the script running
process.on('SIGINT', () => {
    console.log('\n👋 Keep-alive service stopped');
    process.exit(0);
});
