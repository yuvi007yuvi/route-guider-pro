import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MdEdit, MdDelete } from 'react-icons/md';

const AssignmentsView = () => {
    const [assignments, setAssignments] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    
    // Form State
    const [editingId, setEditingId] = useState(null);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [selectedRoutes, setSelectedRoutes] = useState([]); // Array for multiple routes
    const [assignedDate, setAssignedDate] = useState('');

    // Derived State
    const uniqueWards = [...new Set(routes.map(r => r.ward).filter(Boolean))].sort();
    const filteredRoutes = selectedWard ? routes.filter(r => r.ward === selectedWard) : routes;

    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (!userInfo || userInfo.role !== 'admin') {
            navigate('/');
        } else {
            fetchInitialData();
        }
    }, [navigate]);

    const fetchInitialData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data: driversData } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/drivers`, config);
            const { data: routesData } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes`, config);
            const { data: assignmentsData } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/assignments/all`, config);
            
            setDrivers(driversData);
            setRoutes(routesData);
            setAssignments(assignmentsData);
        } catch (error) {
            console.error('Error fetching data', error);
        }
    };

    const handleOpenModal = (assignment = null) => {
        if (assignment) {
            setEditingId(assignment._id);
            setSelectedDriver(assignment.driverId ? assignment.driverId._id : '');
            setSelectedWard(''); // Ward filtering will reset, just select route directly
            setSelectedRoutes(assignment.routeId ? [assignment.routeId._id] : []);
            setAssignedDate(assignment.assignedDate ? assignment.assignedDate.substring(0, 10) : '');
        } else {
            setEditingId(null);
            setSelectedDriver('');
            setSelectedWard('');
            setSelectedRoutes([]);
            setAssignedDate('');
        }
        setShowModal(true);
    };

    const handleRouteToggle = (routeId) => {
        setSelectedRoutes(prev => 
            prev.includes(routeId) ? prev.filter(id => id !== routeId) : [...prev, routeId]
        );
    };

    const handleSaveAssignment = async (e) => {
        e.preventDefault();
        if (selectedRoutes.length === 0) {
            return alert('Please select at least one route.');
        }

        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            
            if (editingId) {
                // Editing supports only updating the 1 assignment
                const payload = { driverId: selectedDriver, routeId: selectedRoutes[0], assignedDate };
                await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/assignment/${editingId}`, payload, config);
                alert('Assignment updated successfully!');
            } else {
                // Creating supports multiple assignments
                const promises = selectedRoutes.map(routeId => {
                    const payload = { driverId: selectedDriver, routeId, assignedDate };
                    return axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/assign`, payload, config);
                });
                await Promise.all(promises);
                alert(`${selectedRoutes.length} Route(s) assigned successfully!`);
            }
            
            setShowModal(false);
            fetchInitialData();
        } catch (error) {
            console.error('Error saving assignment', error);
            alert(error.response?.data?.message || 'Failed to save assignment');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this assignment?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/assignment/${id}`, config);
                alert('Assignment deleted successfully!');
                fetchInitialData();
            } catch (error) {
                console.error('Error deleting assignment', error);
                alert(error.response?.data?.message || 'Failed to delete assignment');
            }
        }
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="m-0">Manage Assignments</h2>
                <div>
                    <Button variant="primary" onClick={() => handleOpenModal()}>+ Assign Route</Button>
                </div>
            </div>

            <Table striped bordered hover responsive className="bg-white shadow-sm rounded mt-3 text-center align-middle">
                <thead className="table-light">
                    <tr>
                        <th>Driver Name</th>
                        <th>Ward</th>
                        <th>Route Name</th>
                        <th>Assigned Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {assignments.map(assignment => (
                        <tr key={assignment._id}>
                            <td className="fw-bold">{assignment.driverId ? assignment.driverId.name : 'Unknown Driver'}</td>
                            <td>{assignment.driverId ? (assignment.driverId.ward || 'N/A') : 'N/A'}</td>
                            <td>{assignment.routeId ? assignment.routeId.routeName : 'Unknown Route'}</td>
                            <td>{new Date(assignment.assignedDate).toLocaleDateString()}</td>
                            <td>
                                <span className={`badge ${assignment.status === 'completed' ? 'bg-success' : assignment.status === 'in_progress' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                                    {assignment.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </td>
                            <td>
                                <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenModal(assignment)}>
                                    <MdEdit />
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleDelete(assignment._id)}>
                                    <MdDelete />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {assignments.length === 0 && (
                        <tr>
                            <td colSpan="6" className="text-center py-4 text-muted">No routes assigned yet.</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{editingId ? 'Edit Assignment' : 'Assign Route to Driver'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSaveAssignment}>
                        <Form.Group className="mb-3">
                            <Form.Label>Driver</Form.Label>
                            <Form.Select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} required>
                                <option value="">Select a driver...</option>
                                {drivers.filter(d => d.role === 'driver').map(d => (
                                    <option key={d._id} value={d._id}>{d.name} (Ward: {d.ward || 'Unassigned'}) - {d.mobile}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {!editingId && (
                            <Form.Group className="mb-3">
                                <Form.Label>Filter by Ward</Form.Label>
                                <Form.Select value={selectedWard} onChange={(e) => {
                                    setSelectedWard(e.target.value);
                                    setSelectedRoute('');
                                }}>
                                    <option value="">All Wards</option>
                                    {uniqueWards.map(ward => (
                                        <option key={ward} value={ward}>{ward}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label>{editingId ? 'Route' : 'Routes (Select Multiple)'}</Form.Label>
                            {editingId ? (
                                <Form.Select value={selectedRoutes[0] || ''} onChange={(e) => setSelectedRoutes([e.target.value])} required>
                                    <option value="">Select a route...</option>
                                    {routes.map(r => (
                                        <option key={r._id} value={r._id}>
                                            {r.routeName} {r.routeId ? `(${r.routeId})` : ''} - {r.totalStops} Stops
                                        </option>
                                    ))}
                                </Form.Select>
                            ) : (
                                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                                    {filteredRoutes.length === 0 ? (
                                        <span className="text-muted">No routes available.</span>
                                    ) : (
                                        filteredRoutes.map(r => (
                                            <Form.Check 
                                                key={r._id}
                                                type="checkbox"
                                                id={`route-${r._id}`}
                                                label={`${r.routeName} ${r.routeId ? `(${r.routeId})` : ''} - ${r.totalStops} Stops`}
                                                checked={selectedRoutes.includes(r._id)}
                                                onChange={() => handleRouteToggle(r._id)}
                                                className="mb-2"
                                            />
                                        ))
                                    )}
                                </div>
                            )}
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Assignment Date</Form.Label>
                            <Form.Control type="date" value={assignedDate} onChange={(e) => setAssignedDate(e.target.value)} required />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100 fw-bold">{editingId ? 'Update Assignment' : 'Assign Route'}</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AssignmentsView;
