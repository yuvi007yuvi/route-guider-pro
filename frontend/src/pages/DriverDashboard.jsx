import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MdLogout, MdNavigation, MdCheckCircle, MdSchedule, MdDirectionsCar } from 'react-icons/md';
import logo from '../assets/logo.png'; // Make sure this path matches where logo.png is

const DriverDashboard = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        const info = localStorage.getItem('userInfo');
        if (info) {
            const parsedInfo = JSON.parse(info);
            if (parsedInfo.role !== 'driver') {
                navigate('/admin'); // Redirect admins trying to access driver dashboard
            } else {
                setUserInfo(parsedInfo);
                fetchAssignments(parsedInfo);
            }
        } else {
            navigate('/');
        }
    }, [navigate]);

    const fetchAssignments = async (user) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/routes/assigned/${user._id}`, config);
            setAssignments(data);
        } catch (error) {
            console.error(error);
        }
    };

    const logoutHandler = () => {
        localStorage.removeItem('userInfo');
        navigate('/');
    };

    const startNavigation = (assignmentId) => {
        navigate(`/driver/navigate/${assignmentId}`);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <Badge bg="success" className="px-3 py-2 rounded-pill"><MdCheckCircle className="me-1"/> Completed</Badge>;
            case 'in_progress': return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill"><MdDirectionsCar className="me-1"/> In Progress</Badge>;
            default: return <Badge bg="primary" className="px-3 py-2 rounded-pill"><MdSchedule className="me-1"/> Pending</Badge>;
        }
    };

    return (
        <div className="bg-animated min-vh-100 d-flex flex-column">
            {/* Top Navbar */}
            <Navbar className="glass-card mx-3 mt-3 rounded-pill px-4 shadow-sm" expand="lg">
                <Container fluid>
                    <Navbar.Brand className="d-flex align-items-center fw-bold" style={{ color: 'var(--primary-color)' }}>
                        <img src={logo} alt="Nagar Nigam Logo" height="40" className="me-3" />
                        <span className="d-none d-sm-inline">Route Guider Pro</span>
                    </Navbar.Brand>
                    
                    <div className="d-flex align-items-center gap-3">
                        {userInfo && (
                            <span className="fw-bold text-dark d-none d-md-block">
                                Welcome, {userInfo.name}
                            </span>
                        )}
                        <Button variant="outline-danger" className="rounded-pill px-4 fw-bold d-flex align-items-center gap-2" onClick={logoutHandler}>
                            <MdLogout size={20} /> Logout
                        </Button>
                    </div>
                </Container>
            </Navbar>

            {/* Main Content */}
            <Container className="flex-grow-1 py-5">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h2 className="fw-bold text-dark m-0" style={{ textShadow: '0px 2px 4px rgba(255,255,255,0.5)' }}>
                        My Assigned Routes
                    </h2>
                    <span className="badge bg-white text-success shadow-sm px-3 py-2 rounded-pill fs-6 border border-success">
                        {assignments.length} Total Route(s)
                    </span>
                </div>

                {assignments.length === 0 ? (
                    <div className="glass-card text-center p-5 rounded-4 shadow-lg">
                        <MdCheckCircle size={60} className="text-success mb-3 opacity-75" />
                        <h4 className="text-muted fw-bold">No routes assigned right now.</h4>
                        <p className="text-muted mb-0">Check back later or contact your admin.</p>
                    </div>
                ) : (
                    <Row className="g-4">
                        {assignments.map((assignment) => (
                            <Col lg={6} xl={4} key={assignment._id}>
                                <Card className={`glass-card h-100 border-0 shadow-sm transition-hover ${assignment.status === 'completed' ? 'opacity-75' : ''}`} style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                                    
                                    {/* Card Header Strip */}
                                    <div style={{ height: '8px', background: assignment.status === 'completed' ? '#198754' : assignment.status === 'in_progress' ? '#ffc107' : 'var(--primary-color)' }}></div>
                                    
                                    <Card.Body className="p-4 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <h4 className="fw-bold text-dark mb-0">
                                                {assignment.routeId?.routeName || 'Unknown Route'}
                                            </h4>
                                            {getStatusBadge(assignment.status)}
                                        </div>

                                        <div className="mb-4 flex-grow-1">
                                            <p className="text-muted mb-2 d-flex align-items-center gap-2 fw-500">
                                                <MdSchedule size={18} className="text-success" />
                                                <strong>Assigned For:</strong> {new Date(assignment.assignedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-muted mb-0 d-flex align-items-center gap-2 fw-500">
                                                <MdDirectionsCar size={18} className="text-success" />
                                                <strong>Total Stops:</strong> {assignment.routeId?.totalStops || 0}
                                            </p>
                                        </div>

                                        <Button 
                                            variant={assignment.status === 'completed' ? "secondary" : "success"} 
                                            size="lg"
                                            className="w-100 rounded-pill fw-bold d-flex justify-content-center align-items-center gap-2 shadow-sm"
                                            onClick={() => startNavigation(assignment._id)}
                                            disabled={assignment.status === 'completed'}
                                        >
                                            {assignment.status === 'completed' ? (
                                                <> <MdCheckCircle size={22} /> Route Finished </>
                                            ) : assignment.status === 'in_progress' ? (
                                                <> <MdNavigation size={22} /> Resume Route </>
                                            ) : (
                                                <> <MdNavigation size={22} /> Start Route </>
                                            )}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            {/* Signature Footer */}
            <div className="text-center py-4 mt-auto">
                <span className="glass-card px-4 py-2 rounded-pill fw-bold shadow-sm d-inline-block" style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                    CRAFTED WITH <span className="text-danger">♥</span> BY <br />
                    <span style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>Yuvraj Singh Tomar</span>
                </span>
            </div>
        </div>
    );
};

export default DriverDashboard;
