import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MdVpnKey, MdBlock, MdCheckCircle } from 'react-icons/md';

const DriversView = () => {
    const [drivers, setDrivers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [role, setRole] = useState('driver');
    const [ward, setWard] = useState('');
    
    // Password Reset State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetData, setResetData] = useState({ userId: '', userName: '', newPassword: '' });
    const navigate = useNavigate();

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (!userInfo || userInfo.role !== 'admin') {
            navigate('/');
        } else {
            fetchDrivers();
        }
    }, [navigate]);

    const fetchDrivers = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/drivers`, config);
            setDrivers(data);
        } catch (error) {
            console.error('Error fetching drivers', error);
        }
    };

    const handleAddDriver = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/drivers`, { name, mobile, password, vehicleNumber, role, ward }, config);
            setShowModal(false);
            setName(''); setMobile(''); setPassword(''); setVehicleNumber(''); setRole('driver'); setWard('');
            fetchDrivers();
        } catch (error) {
            console.error('Error adding user', error);
            alert('Failed to add user');
        }
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
            await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/drivers/${resetData.userId}/reset-password`, { newPassword: resetData.newPassword }, config);
            setShowResetModal(false);
            setResetData({ userId: '', userName: '', newPassword: '' });
            alert('Password reset successfully!');
        } catch (error) {
            console.error('Error resetting password', error);
            alert(error.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleToggleStatus = async (driver) => {
        const newStatus = driver.status === 'active' ? 'inactive' : 'active';
        const actionText = newStatus === 'inactive' ? 'disable' : 'enable';
        
        if (window.confirm(`Are you sure you want to ${actionText} this user?`)) {
            try {
                const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/drivers/${driver._id}`, { status: newStatus }, config);
                fetchDrivers();
            } catch (error) {
                console.error('Error updating status', error);
                alert(error.response?.data?.message || 'Failed to update user status');
            }
        }
    };

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="m-0">Manage Users & Drivers</h2>
                <div>
                    <Button variant="primary" onClick={() => setShowModal(true)}>+ Add User</Button>
                </div>
            </div>

            <Table striped bordered hover responsive className="bg-white shadow-sm rounded">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Role</th>
                        <th>Ward</th>
                        <th>Vehicle Number</th>
                        <th>Status</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {drivers.map(driver => (
                        <tr key={driver._id}>
                            <td>{driver.name}</td>
                            <td>{driver.mobile}</td>
                            <td><span className={`badge ${driver.role === 'admin' ? 'bg-danger' : 'bg-success'}`}>{driver.role.toUpperCase()}</span></td>
                            <td>{driver.ward || 'N/A'}</td>
                            <td>{driver.vehicleNumber || 'N/A'}</td>
                            <td>
                                <span className={`badge ${driver.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                                    {driver.status.toUpperCase()}
                                </span>
                            </td>
                            <td className="text-center d-flex justify-content-center align-items-center">
                                <Form.Check 
                                    type="switch"
                                    id={`status-switch-${driver._id}`}
                                    checked={driver.status === 'active'}
                                    onChange={() => handleToggleStatus(driver)}
                                    className="me-3"
                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                    title={driver.status === 'active' ? 'Disable User' : 'Enable User'}
                                />
                                <Button 
                                    variant="link" 
                                    className="text-warning p-0" 
                                    title="Reset Password"
                                    onClick={() => {
                                        setResetData({ userId: driver._id, userName: driver.name, newPassword: '' });
                                        setShowResetModal(true);
                                    }}
                                >
                                    <MdVpnKey size={22} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add New User</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleAddDriver}>
                        <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Select value={role} onChange={(e) => setRole(e.target.value)} required>
                                <option value="driver">Driver</option>
                                <option value="admin">Admin</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mobile</Form.Label>
                            <Form.Control type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Ward</Form.Label>
                            <Form.Control type="text" value={ward} onChange={(e) => setWard(e.target.value)} placeholder="e.g. Ward 5" />
                        </Form.Group>
                        {role === 'driver' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Vehicle Number (Optional)</Form.Label>
                                <Form.Control type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                            </Form.Group>
                        )}
                        <Button variant="primary" type="submit">Save User</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Password Reset Modal */}
            <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Enter a new password for user: <strong>{resetData.userName}</strong></p>
                    <Form onSubmit={handleResetPasswordSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={resetData.newPassword} 
                                onChange={(e) => setResetData({...resetData, newPassword: e.target.value})} 
                                required 
                                minLength="6"
                                placeholder="Enter new password (min 6 chars)"
                            />
                        </Form.Group>
                        <Button variant="warning" type="submit" className="w-100">Reset Password</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default DriversView;
