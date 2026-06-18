const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const Route = require('../models/Route');
const RouteStop = require('../models/RouteStop');

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/route-guider-pro');

const importRoutes = async () => {
    console.log('Started reading CSV...');
    const results = [];
    const filePath = 'd:/Mathura project/route-guider-pro/LOGO/mathura_2026-06-18.csv';

    // To prevent unique constraint errors if re-running
    await Route.deleteMany({});
    await RouteStop.deleteMany({});
    console.log('Cleared existing routes for fresh import.');

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} rows from CSV. Processing...`);
            let successCount = 0;
            let errorCount = 0;

            for (const row of results) {
                try {
                    const ward = row['Ward Area'];
                    const routeId = row['Route ID'];
                    const routeName = row['Route Name'];
                    const routeType = row['Route Type'];
                    const kmlContent = row['KML Content'];

                    if (!routeName || !kmlContent) {
                        continue;
                    }

                    // Extract coordinates from KML
                    // Looking for <coordinates>...</coordinates>
                    const coordMatch = kmlContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
                    
                    let stopsData = [];
                    if (coordMatch && coordMatch[1]) {
                        const rawCoords = coordMatch[1].trim();
                        // Coordinates are space-separated, and each is lng,lat,alt
                        const points = rawCoords.split(/\s+/);
                        
                        points.forEach((point, index) => {
                            if (!point) return;
                            const [lng, lat] = point.split(',');
                            if (lng && lat) {
                                stopsData.push({
                                    stopName: `Stop ${index + 1}`,
                                    latitude: parseFloat(lat),
                                    longitude: parseFloat(lng),
                                    sequenceNumber: index + 1
                                });
                            }
                        });
                    }

                    // Insert Route
                    const route = await Route.create({
                        routeId,
                        routeName,
                        ward,
                        routeType,
                        description: `Imported from CSV - Ward: ${ward}`,
                        totalStops: stopsData.length
                    });

                    // Insert RouteStops
                    if (stopsData.length > 0) {
                        const stopDocs = stopsData.map(stop => ({
                            routeId: route._id,
                            ...stop
                        }));
                        await RouteStop.insertMany(stopDocs);
                    }

                    successCount++;
                } catch (err) {
                    console.error(`Error processing route ${row['Route ID']}:`, err.message);
                    errorCount++;
                }
            }

            console.log(`Import complete! Successfully imported: ${successCount} routes. Errors: ${errorCount}.`);
            mongoose.connection.close();
            process.exit();
        });
};

importRoutes();
