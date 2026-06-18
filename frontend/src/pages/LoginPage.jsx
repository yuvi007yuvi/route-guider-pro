import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const submitHandler = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, { mobile, password }, config);
            
            localStorage.setItem('userInfo', JSON.stringify(data));
            
            if (data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/driver');
            }
        } catch (err) {
            setError(err.response && err.response.data.message ? err.response.data.message : err.message);
        }
    };

    return (
        <Container fluid className="d-flex align-items-center justify-content-center login-animated-bg p-0">
            <Row className="w-100 m-0">
                <Col md={{ span: 8, offset: 2 }} lg={{ span: 4, offset: 4 }} className="p-3">
                    <Card className="glass-card p-4 rounded-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <img src="/nagar-nigam (1).png" alt="Nagar Nigam" style={{ height: '65px', objectFit: 'contain' }} />
                                <img src="/NatureGreen_Logo.png" alt="Nature Green" style={{ height: '65px', objectFit: 'contain' }} />
                            </div>
                            <h3 className="text-center mb-4 fw-bold text-success">Route Guider Pro</h3>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <Form onSubmit={submitHandler}>
                                <Form.Group className="mb-3" controlId="mobile">
                                    <Form.Label>Mobile Number</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        placeholder="Enter mobile number" 
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        required 
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="password">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control 
                                        type="password" 
                                        placeholder="Password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required 
                                    />
                                </Form.Group>

                                <Button variant="success" type="submit" className="w-100 mt-4 py-2 fw-bold shadow-sm rounded-pill">
                                    Sign In
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage;
