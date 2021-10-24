import React from 'react'
import { Row,Col,Card } from 'react-bootstrap';
import enrollImg from '../../img/enroll.svg'

const GoGoUserEnrolledRooms = ({enrolledRooms, loadingEnrolledRooms}) => {
    return (
        <Row xs={1} md={2} className="g-4">
            {enrolledRooms.map((e, idx) => (
                <Col key={e.roomToken}>
                    <Card>
                        <Card.Img variant="top" src={enrollImg} className="enrollImgStyle" />
                        <Card.Body>
                        <Card.Title>{e.roomName} - {e.roomToken}</Card.Title>
                        <Card.Text>
                            Room created by: {e.roomOwner.name}
                        </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>    
    )
}

export default GoGoUserEnrolledRooms
