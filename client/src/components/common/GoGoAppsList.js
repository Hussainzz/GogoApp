import React from 'react'
import { Card,Container,Row,Col,Button } from 'react-bootstrap';
import {useHistory} from 'react-router-dom'
const GoGoAppsList = () => {
    const history = useHistory();

    function handleEnterRoomsClick(path) {
        history.push(path);
    }

      
    return (
        <Container  className="mt-4">
                    <Row className="pt-4">
                        <Col  md>
                            <Card>
                                <Card.Header as="h5">GoGo Rooms</Card.Header>
                                <Card.Body>
                                    <Card.Title>Create and join rooms</Card.Title>
                                    <Card.Text>
                                       rooms
                                    </Card.Text>
                                    <Button variant="primary" onClick={() => handleEnterRoomsClick("gogo-rooms")}>Enter</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col  md className="d-none">
                            <Card>
                                <Card.Header as="h5">GoGo Docs</Card.Header>
                                <Card.Body>
                                    <Card.Title>Create and Share Doc</Card.Title>
                                    <Card.Text>
                                        Real time shared doc
                                    </Card.Text>
                                    <Button variant="primary" disabled>Enter</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
    )
}

export default GoGoAppsList
