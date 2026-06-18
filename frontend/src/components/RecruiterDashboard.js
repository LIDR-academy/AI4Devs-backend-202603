import React from 'react';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logo from '../assets/lti-logo.png';

const RecruiterDashboard = () => {
    return (
        <Container className="mt-5">
            <div className="text-center">
                <img src={logo} alt="LTI Logo" style={{ width: '150px' }} />
            </div>
            <h1 className="mb-4 text-center">Dashboard del Reclutador</h1>
            <Row className="g-3">
                <Col md={6}>
                    <Card className="shadow p-4 h-100">
                        <h5 className="mb-3">Candidatos</h5>
                        <p className="text-muted small">Ver todos los candidatos por posición en vista Kanban.</p>
                        <Link to="/candidates">
                            <Button variant="success" className="btn-block w-100">Ver Candidatos</Button>
                        </Link>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow p-4 h-100">
                        <h5 className="mb-3">Añadir Candidato</h5>
                        <p className="text-muted small">Registrar un nuevo candidato en el sistema.</p>
                        <Link to="/add-candidate">
                            <Button variant="primary" className="btn-block w-100">Añadir Nuevo Candidato</Button>
                        </Link>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RecruiterDashboard;