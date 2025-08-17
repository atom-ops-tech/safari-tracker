// safari-server.js
// Simple Node.js server for Safari Wildlife Tracker
// No external dependencies except built-in Node modules

const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Configuration
const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.SAFARI_PASSWORD || 'safari2025';
const DATA_FILE = 'safari-data.json';

// CORS headers for browser access
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Password',
    'Content-Type': 'application/json'
};

// Load or initialize data
let sightingsData = [];

async function loadData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        sightingsData = JSON.parse(data);
        console.log(`Loaded ${sightingsData.length} sightings from disk`);
    } catch (error) {
        console.log('No existing data file, starting fresh');
        sightingsData = [];
    }
}

async function saveData() {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(sightingsData, null, 2));
        console.log(`Saved ${sightingsData.length} sightings to disk`);
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Request handler
async function handleRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200, CORS_HEADERS);
        res.end();
        return;
    }
    
    // Check password for all routes except health
    if (pathname !== '/health') {
        const password = req.headers['x-password'];
        if (password !== PASSWORD) {
            res.writeHead(401, CORS_HEADERS);
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
    }
    
    // Routes
    try {
        if (pathname === '/health' && req.method === 'GET') {
            // Health check endpoint
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
            
        } else if (pathname === '/sightings' && req.method === 'GET') {
            // Get all sightings
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify(sightingsData));
            
        } else if (pathname === '/sync' && req.method === 'POST') {
            // Sync sightings from a device
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const { deviceId, sightings } = data;
                    
                    if (!deviceId || !sightings) {
                        res.writeHead(400, CORS_HEADERS);
                        res.end(JSON.stringify({ error: 'Missing deviceId or sightings' }));
                        return;
                    }
                    
                    // Merge sightings
                    const existingIds = new Set(sightingsData.map(s => s.id));
                    let newCount = 0;
                    
                    sightings.forEach(sighting => {
                        if (!existingIds.has(sighting.id)) {
                            sightingsData.push(sighting);
                            newCount++;
                        } else {
                            // Update existing sighting if this one is newer
                            const index = sightingsData.findIndex(s => s.id === sighting.id);
                            if (index !== -1) {
                                const existing = sightingsData[index];
                                if (new Date(sighting.timestamp) > new Date(existing.timestamp)) {
                                    sightingsData[index] = sighting;
                                }
                            }
                        }
                    });
                    
                    await saveData();
                    
                    res.writeHead(200, CORS_HEADERS);
                    res.end(JSON.stringify({ 
                        success: true, 
                        newSightings: newCount,
                        totalSightings: sightingsData.length 
                    }));
                    
                    console.log(`Synced ${newCount} new sightings from device ${deviceId}`);
                } catch (error) {
                    console.error('Sync error:', error);
                    res.writeHead(500, CORS_HEADERS);
                    res.end(JSON.stringify({ error: 'Server error' }));
                }
            });
            
        } else if (pathname === '/export' && req.method === 'GET') {
            // Export data as CSV
            const activeSightings = sightingsData.filter(s => !s.deleted);
            
            const csv = [
                'Animal,Count,Date,Time,User,Notes',
                ...activeSightings.map(s => {
                    const date = new Date(s.timestamp);
                    return [
                        s.animal,
                        s.count,
                        date.toLocaleDateString(),
                        date.toLocaleTimeString(),
                        s.user,
                        s.notes || ''
                    ].join(',');
                })
            ].join('\n');
            
            res.writeHead(200, {
                ...CORS_HEADERS,
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="safari-export-${new Date().toISOString().split('T')[0]}.csv"`
            });
            res.end(csv);
            
        } else if (pathname === '/stats' && req.method === 'GET') {
            // Get statistics
            const activeSightings = sightingsData.filter(s => !s.deleted);
            
            const stats = {
                totalSightings: activeSightings.reduce((sum, s) => sum + s.count, 0),
                uniqueAnimals: [...new Set(activeSightings.map(s => s.animal))].length,
                totalRecords: activeSightings.length,
                users: [...new Set(activeSightings.map(s => s.user))],
                animalCounts: {}
            };
            
            // Count by animal
            activeSightings.forEach(s => {
                if (!stats.animalCounts[s.animal]) {
                    stats.animalCounts[s.animal] = 0;
                }
                stats.animalCounts[s.animal] += s.count;
            });
            
            res.writeHead(200, CORS_HEADERS);
            res.end(JSON.stringify(stats));
            
        } else {
            // 404 for unknown routes
            res.writeHead(404, CORS_HEADERS);
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } catch (error) {
        console.error('Request error:', error);
        res.writeHead(500, CORS_HEADERS);
        res.end(JSON.stringify({ error: 'Server error' }));
    }
}

// Create and start server
const server = http.createServer(handleRequest);

async function start() {
    await loadData();
    
    server.listen(PORT, () => {
        console.log(`Safari Tracker Server running on port ${PORT}`);
        console.log(`Password: ${PASSWORD}`);
        console.log('\nEndpoints:');
        console.log('  GET  /health     - Health check');
        console.log('  GET  /sightings  - Get all sightings');
        console.log('  POST /sync       - Sync sightings from device');
        console.log('  GET  /export     - Export as CSV');
        console.log('  GET  /stats      - Get statistics');
    });
}

// Auto-save every 5 minutes
setInterval(saveData, 5 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await saveData();
    process.exit(0);
});

// Start the server
start();