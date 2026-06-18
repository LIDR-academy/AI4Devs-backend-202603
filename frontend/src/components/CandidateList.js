import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Badge, Spinner, Alert, Form, Button
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

const STEP_COLORS = ['primary', 'warning', 'success', 'info', 'secondary'];

const AverageScore = ({ score }) => {
    if (score === null) return <span className="text-muted">Sin puntuación</span>;
    const color = score >= 7 ? 'success' : score >= 5 ? 'warning' : 'danger';
    return <Badge bg={color}>⭐ {score}</Badge>;
};

const CandidateList = () => {
    const [positionId, setPositionId] = useState(1);
    const [inputId, setInputId] = useState('1');
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchCandidates = async (id) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:3010/positions/${id}/candidates`);
            if (res.status === 404) {
                setError('No se encontró la posición indicada.');
                setCandidates([]);
                return;
            }
            if (!res.ok) throw new Error('Error al obtener candidatos');
            const data = await res.json();
            setCandidates(data);
        } catch (err) {
            setError('Error de conexión con el servidor.');
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates(positionId);
    }, [positionId]);

    const handleSearch = (e) => {
        e.preventDefault();
        const id = parseInt(inputId);
        if (!isNaN(id) && id > 0) setPositionId(id);
    };

    // Agrupar candidatos por etapa para vista Kanban
    const stepMap = candidates.reduce((acc, c) => {
        const key = c.currentInterviewStep.name;
        if (!acc[key]) acc[key] = { step: c.currentInterviewStep, items: [] };
        acc[key].items.push(c);
        return acc;
    }, {});

    const columns = Object.values(stepMap).sort((a, b) => a.step.orderIndex - b.step.orderIndex);

    return (
        <Container fluid className="mt-4 px-4">
            <Row className="mb-4 align-items-center">
                <Col>
                    <h2 className="mb-0">Candidatos por Posición</h2>
                    <small className="text-muted">Vista Kanban por etapa de entrevista</small>
                </Col>
                <Col md="auto">
                    <Link to="/">
                        <Button variant="outline-secondary" size="sm">← Volver al Dashboard</Button>
                    </Link>
                </Col>
            </Row>

            <Form onSubmit={handleSearch} className="mb-4">
                <Row className="align-items-end g-2">
                    <Col md={3}>
                        <Form.Label className="fw-semibold">ID de Posición</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            value={inputId}
                            onChange={(e) => setInputId(e.target.value)}
                            placeholder="Ej: 1"
                        />
                    </Col>
                    <Col md="auto">
                        <Button type="submit" variant="primary">Buscar candidatos</Button>
                    </Col>
                </Row>
            </Form>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading && (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Cargando candidatos...</p>
                </div>
            )}

            {!loading && !error && candidates.length === 0 && (
                <Alert variant="info">No hay candidatos postulados para esta posición.</Alert>
            )}

            {!loading && columns.length > 0 && (
                <Row className="g-3 flex-nowrap overflow-auto pb-3">
                    {columns.map(({ step, items }, colIdx) => (
                        <Col key={step.id} md={4} style={{ minWidth: '280px' }}>
                            <div className="d-flex align-items-center mb-2 gap-2">
                                <Badge bg={STEP_COLORS[colIdx % STEP_COLORS.length]} className="px-3 py-2 fs-6">
                                    {step.orderIndex}
                                </Badge>
                                <span className="fw-bold">{step.name}</span>
                                <Badge bg="light" text="dark" className="ms-auto">{items.length}</Badge>
                            </div>
                            <div className="d-flex flex-column gap-2">
                                {items.map((c) => (
                                    <Card key={c.applicationId} className="shadow-sm border-0">
                                        <Card.Body className="py-2 px-3">
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <div className="fw-semibold">{c.fullName}</div>
                                                    <small className="text-muted">
                                                        Candidato #{c.candidateId} · App #{c.applicationId}
                                                    </small>
                                                </div>
                                                <AverageScore score={c.averageScore} />
                                            </div>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
};

export default CandidateList;
