import React from 'react'
import {Row, Col,Badge } from 'react-bootstrap'
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import { FaTimes } from "react-icons/fa";
import { removeUserCreatedRoom, deleteRoomAsync } from '../../redux/roomSlice';
import {useDispatch} from 'react-redux';

const GoGoUserRooms = ({userRooms}) => {
    const dispatch = useDispatch();
    const deleteRoom = (roomT) => {
        dispatch(removeUserCreatedRoom(roomT))
        dispatch(deleteRoomAsync(roomT))
    }
    return (
        <>
            {userRooms.map((room,index) => (
               <Col  md key={index} className="text-white">
                    <div className="room">

                        <Row>
                            <Col xs={10}>
                                <p><Badge bg="primary" className="bg-dark">{room.roomName} - {room.roomToken}</Badge></p>
                                
                                {room.isRoomPrivate  && <p className="float-right"><Badge bg="primary" className="bg-dark">private</Badge></p>}
                            </Col>
                            <Col xs={2} className="text-center">
                                <FaTimes style={{cursor: 'pointer'}} onClick={() => deleteRoom(room.roomToken)}/>
                            </Col>
                        </Row>
                        <div className="rooms-footer">
                        <Link to={`/gogo-room/${room.roomToken}`}>
                            <button className="save">Join</button>
                        </Link>

                        <Moment format="YYYY/MM/DD">
                            {room.createdAt}
                        </Moment>
                        </div>
                    </div>
                </Col>
            ))}
        </>
    )
}

export default GoGoUserRooms
