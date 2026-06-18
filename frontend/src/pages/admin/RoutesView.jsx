import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Table, Button, Form, Modal, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { MdEdit, MdDelete, MdAdd, MdUploadFile, MdMap } from 'react-icons/md';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RoutesView = () => {
    const [routes, setRoutes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // New Route Form State
    const [routeName, setRouteName] = useState('');
    const [description, setDescription] = useState('');
    const [stops, setStops] = useState([{ stopName: '', latitude: '', longitude: '' }]);
    
    // Edit Route State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: '', routeName: '', description: '', ward: '', routeType: '' });
    
    // Map Route State
    const [mapRouteData, setMapRouteData] = useState(null);
    
    const kmlInputRef = useRef(null);
    const csvInputRef = useRef(null);
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const routesPerPage = 20;

    useEffect(() => {
        if (!userInfo || userInfo.role !== 'admin') {
            navigate('/');
        } else {
            fetchRoutes();
        }
    }, [navigate]);

    const fetchRoutes = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes`, config);
            setRoutes(data);
        } catch (error) {
            console.error('Error fetching routes', error);
        }
    };

    const handleStopChange = (index, field, value) => {
        const updatedStops = [...stops];
        updatedStops[index][field] = value;
        setStops(updatedStops);
    };

    const addStopField = () => {
        setStops([...stops, { stopName: '', latitude: '', longitude: '' }]);
    };

    const handleAddRoute = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes`, { routeName, description, stops }, config);
            setShowModal(false);
            setRouteName(''); setDescription(''); setStops([{ stopName: '', latitude: '', longitude: '' }]);
            fetchRoutes();
        } catch (error) {
            console.error('Error adding route', error);
            alert('Failed to add route');
        }
    };

    const handleDeleteRoute = async (id) => {
        if (window.confirm('Are you sure you want to delete this route?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/${id}`, config);
                fetchRoutes();
            } catch (error) {
                console.error('Error deleting route', error);
                alert('Failed to delete route');
            }
        }
    };

    const handleEditRoute = (route) => {
        setEditFormData({
            id: route._id,
            routeName: route.routeName,
            description: route.description || '',
            ward: route.ward || '',
            routeType: route.routeType || ''
        });
        setShowEditModal(true);
    };

    const handleUpdateRoute = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/${editFormData.id}`, editFormData, config);
            setShowEditModal(false);
            fetchRoutes();
        } catch (error) {
            console.error('Error updating route', error);
            alert('Failed to update route');
        }
    };

    const handleViewMap = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/${id}`, config);
            setMapRouteData(data);
        } catch (error) {
            console.error('Error fetching route details', error);
            alert('Failed to load map data');
        }
    };

    const handleKmlUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const kmlText = event.target.result;
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(kmlText, "text/xml");

                const routesToUpload = [];
                const routeNameFallback = file.name.replace('.kml', '');
                const placemarks = xmlDoc.getElementsByTagName('Placemark');
                
                let extractedStops = [];
                let sequence = 1;

                for (let i = 0; i < placemarks.length; i++) {
                    const placemark = placemarks[i];
                    const nameNode = placemark.getElementsByTagName('name')[0];
                    const stopName = nameNode ? nameNode.textContent : `Stop ${sequence}`;

                    const point = placemark.getElementsByTagName('Point')[0];
                    if (point) {
                        const coordsNode = point.getElementsByTagName('coordinates')[0];
                        if (coordsNode) {
                            const coords = coordsNode.textContent.trim().split(',');
                            extractedStops.push({
                                stopName: stopName,
                                longitude: parseFloat(coords[0]),
                                latitude: parseFloat(coords[1]),
                                sequenceNumber: sequence++
                            });
                        }
                    }

                    const lineString = placemark.getElementsByTagName('LineString')[0];
                    if (lineString) {
                        const coordsNode = lineString.getElementsByTagName('coordinates')[0];
                        if (coordsNode) {
                            const coordPairs = coordsNode.textContent.trim().split(/\s+/);
                            coordPairs.forEach((pair, idx) => {
                                const coords = pair.split(',');
                                if (coords.length >= 2) {
                                    extractedStops.push({
                                        stopName: `${stopName} - Point ${idx + 1}`,
                                        longitude: parseFloat(coords[0]),
                                        latitude: parseFloat(coords[1]),
                                        sequenceNumber: sequence++
                                    });
                                }
                            });
                        }
                    }
                }

                if (extractedStops.length > 0) {
                    routesToUpload.push({
                        routeName: routeNameFallback,
                        description: 'Imported from KML',
                        stops: extractedStops
                    });

                    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                    await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/bulk`, routesToUpload, config);
                    alert('KML Route imported successfully!');
                    fetchRoutes();
                } else {
                    alert('No valid points or paths found in the KML file.');
                }
            } catch (error) {
                console.error('Error parsing KML', error);
                alert('Failed to parse KML file.');
            }
        };
        reader.readAsText(file);
        e.target.value = null; // reset input
    };

    const handleCsvUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const config = { 
                headers: { 
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data'
                } 
            };
            // Alert user that this might take a moment
            alert('Uploading and processing CSV... Please wait.');
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/upload-csv`, formData, config);
            alert(data.message || 'CSV Route import completed!');
            fetchRoutes();
        } catch (error) {
            console.error('Error uploading CSV', error);
            alert(error.response?.data?.message || 'Failed to upload CSV file.');
        }
        e.target.value = null; // reset input
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="m-0 fw-bold" style={{ color: 'var(--primary-color)' }}>Manage Routes</h2>
                    <p className="text-muted mb-0">Total Routes: {routes.length}</p>
                </div>
                <div>
                    <input 
                        type="file" 
                        accept=".kml" 
                        ref={kmlInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleKmlUpload} 
                    />
                    <input 
                        type="file" 
                        accept=".csv" 
                        ref={csvInputRef} 
                        style={{ display: 'none' }} 
                        onChange={handleCsvUpload} 
                    />
                    <Button variant="outline-success" className="me-2 d-flex align-items-center gap-2 d-inline-flex" onClick={() => kmlInputRef.current.click()}>
                        <MdUploadFile size={20} /> Upload KML
                    </Button>
                    <Button variant="outline-primary" className="me-2 d-flex align-items-center gap-2 d-inline-flex" onClick={() => csvInputRef.current.click()}>
                        <MdUploadFile size={20} /> Bulk CSV
                    </Button>
                    <Button variant="success" className="d-flex align-items-center gap-2 shadow-sm d-inline-flex" onClick={() => setShowModal(true)}>
                        <MdAdd size={20} /> Create Route
                    </Button>
                </div>
            </div>

            <Row className="mb-4">
                <Col xs={12}>
                    <div className="bg-white rounded shadow-sm overflow-hidden" style={{ border: '1px solid #e0e0e0' }}>
                        <div className="bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="m-0 text-success fw-bold">
                                {mapRouteData ? mapRouteData.routeName : 'Route Map Preview'}
                            </h5>
                            {mapRouteData && <span className="badge bg-success">{mapRouteData.totalStops} Stops</span>}
                        </div>
                        
                        {mapRouteData && mapRouteData.stops && mapRouteData.stops.length > 0 ? (
                            <div style={{ height: '400px', width: '100%' }}>
                                <MapContainer 
                                    center={[mapRouteData.stops[0].latitude, mapRouteData.stops[0].longitude]} 
                                    zoom={14} 
                                    style={{ height: '100%', width: '100%' }}
                                    key={mapRouteData._id}
                                >
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                                    />
                                    <Polyline 
                                        positions={mapRouteData.stops.map(s => [s.latitude, s.longitude])} 
                                        color="var(--primary-color)" 
                                        weight={5}
                                        opacity={0.8}
                                    />
                                </MapContainer>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '250px', background: '#f8f9fa' }}>
                                <div className="text-center text-muted p-4">
                                    <MdMap size={48} className="mb-2 text-secondary opacity-50" />
                                    {mapRouteData ? (
                                        <>
                                            <h5>No coordinate data found</h5>
                                            <p className="mb-0">This route may not have been correctly imported with spatial data.</p>
                                        </>
                                    ) : (
                                        <>
                                            <h5>Select a Route</h5>
                                            <p className="mb-0">Click the Map icon on any route below to view its path here.</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            <Row>
                <Col xs={12}>
                    <div className="table-responsive rounded shadow-sm border-0" style={{ background: '#fff' }}>
                <Table hover responsive className="mb-0" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead style={{ background: 'var(--primary-color)', color: '#fff' }}>
                        <tr>
                            <th style={{ padding: '15px 20px', borderTopLeftRadius: '8px' }}>Route ID</th>
                            <th style={{ padding: '15px 20px' }}>Ward</th>
                            <th style={{ padding: '15px 20px' }}>Route Name</th>
                            <th style={{ padding: '15px 20px' }}>Type</th>
                            <th style={{ padding: '15px 20px' }}>Total Stops</th>
                            <th style={{ padding: '15px 20px', borderTopRightRadius: '8px', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {routes.slice((currentPage - 1) * routesPerPage, currentPage * routesPerPage).map(route => (
                            <tr key={route._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '15px 20px', verticalAlign: 'middle', fontWeight: '500' }}>{route.routeId || 'N/A'}</td>
                                <td style={{ padding: '15px 20px', verticalAlign: 'middle' }}>{route.ward || 'N/A'}</td>
                                <td style={{ padding: '15px 20px', verticalAlign: 'middle' }}>{route.routeName}</td>
                                <td style={{ padding: '15px 20px', verticalAlign: 'middle' }}>{route.routeType || 'N/A'}</td>
                                <td style={{ padding: '15px 20px', verticalAlign: 'middle' }}>
                                    <span className="badge bg-success bg-opacity-25 text-success px-3 py-2 rounded-pill">
                                        {route.totalStops} Stops
                                    </span>
                                </td>
                                <td style={{ padding: '15px 20px', verticalAlign: 'middle', textAlign: 'center' }}>
                                    <Button variant="link" className="text-info p-0 me-3" title="View on Map" onClick={() => handleViewMap(route._id)}>
                                        <MdMap size={22} />
                                    </Button>
                                    <Button variant="link" className="text-primary p-0 me-3" title="Edit Route" onClick={() => handleEditRoute(route)}>
                                        <MdEdit size={22} />
                                    </Button>
                                    <Button variant="link" className="text-danger p-0" title="Delete Route" onClick={() => handleDeleteRoute(route._id)}>
                                        <MdDelete size={22} />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {routes.length === 0 && (
                            <tr>
                                <td colSpan="6" className="text-center py-5 text-muted">
                                    No routes found. Please import or create some.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
            
            {/* Simple Pagination Controls */}
            {routes.length > routesPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
                    <Button 
                        variant="outline-success" 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-muted">Page {currentPage} of {Math.ceil(routes.length / routesPerPage)}</span>
                    <Button 
                        variant="outline-success" 
                        disabled={currentPage === Math.ceil(routes.length / routesPerPage)} 
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
            </Col>
            </Row>

            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Create New Route</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddRoute}>
                        <Form.Group className="mb-3">
                            <Form.Label>Route Name</Form.Label>
                            <Form.Control type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </Form.Group>

                        <h5>Stops</h5>
                        {stops.map((stop, index) => (
                            <Row key={index} className="mb-2">
                                <Col md={4}>
                                    <Form.Control placeholder="Stop Name" value={stop.stopName} onChange={(e) => handleStopChange(index, 'stopName', e.target.value)} required />
                                </Col>
                                <Col md={4}>
                                    <Form.Control placeholder="Latitude" type="number" step="any" value={stop.latitude} onChange={(e) => handleStopChange(index, 'latitude', e.target.value)} required />
                                </Col>
                                <Col md={4}>
                                    <Form.Control placeholder="Longitude" type="number" step="any" value={stop.longitude} onChange={(e) => handleStopChange(index, 'longitude', e.target.value)} required />
                                </Col>
                            </Row>
                        ))}
                        <Button variant="secondary" size="sm" onClick={addStopField} className="mb-3">
                            + Add Another Stop
                        </Button>
                        <br/>
                        <Button variant="primary" type="submit">Save Route</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit Route Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Route Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleUpdateRoute}>
                        <Form.Group className="mb-3">
                            <Form.Label>Route Name</Form.Label>
                            <Form.Control type="text" value={editFormData.routeName} onChange={(e) => setEditFormData({...editFormData, routeName: e.target.value})} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control type="text" value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Ward</Form.Label>
                            <Form.Control type="text" value={editFormData.ward} onChange={(e) => setEditFormData({...editFormData, ward: e.target.value})} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Route Type</Form.Label>
                            <Form.Control type="text" value={editFormData.routeType} onChange={(e) => setEditFormData({...editFormData, routeType: e.target.value})} />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100 mt-2">Save Changes</Button>
                    </Form>
                </Modal.Body>
            </Modal>

        </Container>
    );
};

export default RoutesView;
