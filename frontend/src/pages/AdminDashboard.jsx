import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Navbar, Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        const info = localStorage.getItem('userInfo');
        if (info) {
            setUserInfo(JSON.parse(info));
        } else {
            navigate('/');
        }
    }, [navigate]);

    const logoutHandler = () => {
        localStorage.removeItem('userInfo');
        navigate('/');
    };

    return (
        <Container fluid>
            <h2 className="mb-4">Overview</h2>
            <Row>
                    <Col md={4}>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Drivers</Card.Title>
                                <Card.Text>Manage Drivers</Card.Text>
                                <Button variant="primary" onClick={() => navigate('/admin/drivers')}>View Drivers</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Routes</Card.Title>
                                <Card.Text>Manage Routes & Stops</Card.Text>
                                <Button variant="primary" onClick={() => navigate('/admin/routes')}>View Routes</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card className="mb-3">
                            <Card.Body>
                                <Card.Title>Assignments</Card.Title>
                                <Card.Text>Assign Routes to Drivers</Card.Text>
                                <Button variant="primary" onClick={() => navigate('/admin/assignments')}>View Assignments</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
        </Container>
    );
};

export default AdminDashboard;
