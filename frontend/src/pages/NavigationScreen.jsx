import React, { useState, useEffect, useRef } from 'react';
import { Container, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { MdNavigation, MdCheckCircle, MdSkipNext, MdMap, MdClose } from 'react-icons/md';

// Fix for default Leaflet icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for driver location
const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to recenter map
const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
};

const NavigationScreen = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignmentData, setAssignmentData] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [nextStop, setNextStop] = useState(null);
    const [distanceToNext, setDistanceToNext] = useState(null);
    const [routeGeoJSON, setRouteGeoJSON] = useState(null); // OSRM Route geometry
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (!userInfo) {
            navigate('/');
        } else {
            fetchAssignmentDetails();
        }
    }, [assignmentId]);

    const fetchAssignmentDetails = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/assignment/${assignmentId}`, config);
            setAssignmentData(data);
            determineNextStop(data.stops, data.progress);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch assignment details');
            setLoading(false);
        }
    };

    // Auto-finish route when all stops are completed
    useEffect(() => {
        if (assignmentData && assignmentData.stops && assignmentData.stops.length > 0 && !loading && nextStop === null) {
            handleFinishRoute();
        }
    }, [assignmentData, nextStop, loading]);

    const determineNextStop = (stops, progress) => {
        // Find the first stop that is not in the progress array
        const completedStopIds = progress.map(p => p.stopId.toString());
        const pendingStops = stops.filter(s => !completedStopIds.includes(s._id.toString()));
        
        if (pendingStops.length > 0) {
            setNextStop(pendingStops[0]);
        } else {
            setNextStop(null); // All done
            setRouteGeoJSON(null);
        }
    };

    // Watch GPS location
    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setDriverLocation({ lat: latitude, lng: longitude });
            },
            (error) => {
                console.error("Error getting location", error);
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Calculate distance and fetch real road route via OSRM
    useEffect(() => {
        if (driverLocation && nextStop) {
            // Fetch OSRM actual road route
            const fetchRoute = async () => {
                try {
                    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${driverLocation.lng},${driverLocation.lat};${nextStop.longitude},${nextStop.latitude}?overview=full&geometries=geojson`;
                    const { data } = await axios.get(osrmUrl);
                    if (data.routes && data.routes.length > 0) {
                        const route = data.routes[0];
                        setRouteGeoJSON(route.geometry);
                        // Convert OSRM distance (meters) to km
                        setDistanceToNext((route.distance / 1000).toFixed(2));
                    }
                } catch (error) {
                    console.error("Failed to fetch OSRM route, falling back to Haversine", error);
                    fallbackDistanceCalc();
                }
            };
            fetchRoute();
        } else {
            setDistanceToNext(null);
            setRouteGeoJSON(null);
        }
    }, [driverLocation, nextStop]);

    const fallbackDistanceCalc = () => {
        const R = 6371; // Earth radius in km
        const dLat = (nextStop.latitude - driverLocation.lat) * (Math.PI/180);
        const dLon = (nextStop.longitude - driverLocation.lng) * (Math.PI/180);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(driverLocation.lat * (Math.PI/180)) * Math.cos(nextStop.latitude * (Math.PI/180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const d = R * c; 
        setDistanceToNext(d.toFixed(2));
    };

    const handleCompleteStop = async () => {
        if (!nextStop) return;
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stops/complete`, {
                assignmentId,
                stopId: nextStop._id,
                remarks: 'Completed'
            }, config);
            fetchAssignmentDetails();
        } catch (err) {
            alert('Failed to complete stop');
        }
    };

    const handleSkipStop = async () => {
        if (!nextStop) return;
        if(window.confirm('Are you sure you want to skip this stop?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/stops/complete`, {
                    assignmentId,
                    stopId: nextStop._id,
                    remarks: 'Skipped'
                }, config);
                fetchAssignmentDetails();
            } catch (err) {
                alert('Failed to skip stop');
            }
        }
    };

    const handleFinishRoute = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/complete`, { assignmentId }, config);
            navigate('/driver');
        } catch (err) {
            alert('Failed to complete route');
        }
    };

    const openGoogleMaps = () => {
        if (driverLocation && nextStop) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.lat},${driverLocation.lng}&destination=${nextStop.latitude},${nextStop.longitude}&travelmode=driving`;
            window.open(url, '_blank');
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" variant="success" /></div>;
    if (error) return <div className="p-5 text-center text-danger fw-bold">{error}</div>;

    const { route, stops } = assignmentData;
    const polylinePositions = stops.map(s => [s.latitude, s.longitude]);
    
    // Initial center
    const centerPoint = driverLocation 
        ? [driverLocation.lat, driverLocation.lng] 
        : (stops.length > 0 ? [stops[0].latitude, stops[0].longitude] : [27.4924, 77.6737]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8f9fa' }}>
            {/* Header */}
            <div className="shadow-sm" style={{ padding: '15px 20px', background: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 className="m-0 fw-bold text-truncate" style={{ maxWidth: '75%' }}>{route.routeName}</h5>
                <Button variant="outline-light" className="rounded-pill d-flex align-items-center gap-1 fw-bold" size="sm" onClick={() => navigate('/driver')}>
                    <MdClose size={18} /> Exit
                </Button>
            </div>
            
            {/* Map Area */}
            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer center={centerPoint} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Fallback Straight Line connecting all stops (light opacity) */}
                    {polylinePositions.length > 0 && (
                        <Polyline positions={polylinePositions} color="gray" weight={3} opacity={0.4} dashArray="5, 10" />
                    )}

                    {/* Dynamic Real Road Route to Next Stop */}
                    {routeGeoJSON && (
                        <GeoJSON 
                            key={JSON.stringify(routeGeoJSON)} 
                            data={routeGeoJSON} 
                            style={{ color: 'var(--primary-color)', weight: 6, opacity: 0.9 }} 
                        />
                    )}

                    {/* All Stops */}
                    {stops.map(stop => (
                        <Marker key={stop._id} position={[stop.latitude, stop.longitude]}>
                            <Popup className="fw-bold">{stop.stopName}</Popup>
                        </Marker>
                    ))}

                    {/* Driver Live Location */}
                    {driverLocation && (
                        <>
                            <RecenterMap lat={driverLocation.lat} lng={driverLocation.lng} />
                            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} zIndexOffset={1000}>
                                <Popup><strong>You are here</strong></Popup>
                            </Marker>
                        </>
                    )}
                </MapContainer>

                {/* Google Maps floating button */}
                {nextStop && driverLocation && (
                    <Button 
                        variant="light" 
                        className="shadow-lg rounded-pill fw-bold d-flex align-items-center gap-2" 
                        style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 1000, border: '2px solid #4285F4', color: '#4285F4' }}
                        onClick={openGoogleMaps}
                    >
                        <MdMap size={20} /> Use Google Maps
                    </Button>
                )}
            </div>

            {/* Bottom Sheet Action Area */}
            <div className="glass-card" style={{ padding: '25px', background: 'white', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', boxShadow: '0 -10px 20px rgba(0,0,0,0.1)', zIndex: 1000 }}>
                {nextStop ? (
                    <>
                        <div className="d-flex justify-content-between align-items-end mb-3">
                            <div>
                                <p className="text-muted mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>HEADING TO:</p>
                                <h3 className="fw-bold text-dark m-0">{nextStop.stopName}</h3>
                            </div>
                            <div className="text-end">
                                <span className="badge bg-success px-3 py-2 rounded-pill fs-6">
                                    {distanceToNext ? `${distanceToNext} km` : 'Calculating...'}
                                </span>
                            </div>
                        </div>
                        
                        <div className="d-flex gap-3 mt-4">
                            <Button variant="success" size="lg" className="flex-grow-1 fw-bold rounded-pill shadow-sm d-flex justify-content-center align-items-center gap-2" onClick={handleCompleteStop}>
                                <MdCheckCircle size={22} /> Arrived & Complete
                            </Button>
                            <Button variant="outline-warning" size="lg" className="fw-bold rounded-pill shadow-sm d-flex justify-content-center align-items-center" onClick={handleSkipStop} title="Skip Stop">
                                <MdSkipNext size={24} />
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-3">
                        <MdCheckCircle size={50} className="text-success mb-3" />
                        <h4 className="text-success fw-bold mb-2">All stops completed!</h4>
                        <p className="text-muted">Returning to dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NavigationScreen;
