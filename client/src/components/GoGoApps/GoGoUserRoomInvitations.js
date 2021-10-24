import React,{useState,useEffect} from 'react'
import { Row,Col,Badge,Button,ButtonGroup } from 'react-bootstrap';
import {useDispatch} from 'react-redux';
import {getUserRoomInvitationsAsync,getUserEnrolledRoomsAsync} from '../../redux/roomSlice';

import { FaTimes,FaCheck,FaSpinner } from "react-icons/fa";
import { enrollToPrivateRoom } from '../../helpers/api';
import { toast } from 'react-toastify';

const GoGoUserRoomInvitations = ({invitations, loadingInvi}) => {
    const dispatch = useDispatch();

    const [enrolling, setEnrolling] = useState("");
    const [fetchInvi, setFetchInvi] = useState(false);

    useEffect(() => {
        if(fetchInvi){
            dispatch(getUserRoomInvitationsAsync());
        }
        return () => { setFetchInvi(false) };
    }, [fetchInvi,dispatch]);

    const handleEnroll = async (payload) => {
        setEnrolling(`${payload.roomToken}:${payload.action}`);
        try {
            const enroll = await enrollToPrivateRoom(payload)
            if(enroll && enroll.status === 'success'){
                setFetchInvi(true);
                dispatch(getUserEnrolledRoomsAsync());
                toast.success(enroll.message, {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                })
            }else{
                toast.error(`Please check your room invite`, {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        } catch (error) {
            toast.error(`Something went wrong`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            })
        }
        setEnrolling("");
    }

    return (
        <>
            <ul className="list-group">
                {invitations.map(invi => (
                    <li className="list-group-item" key={invi.room.roomToken}>
                        <Row>
                            <Col xs={6}>
                                <Badge bg="primary" className="bg-dark">{invi.room.roomName} - {invi.room.roomToken}</Badge>
                            </Col>
                            <Col xs={6} className="text-center">
                                <ButtonGroup size="sm">
                                    <Button disabled={enrolling === `${invi.room.roomToken}:accepted`} onClick={() => handleEnroll({roomToken: invi.room.roomToken, action:"accepted"})}>
                                        {enrolling !== `${invi.room.roomToken}:accepted` ? <FaCheck/> : <FaSpinner className="icon-spin"/>}
                                    </Button>
                                    <Button disabled={enrolling === `${invi.room.roomToken}:rejected`} onClick={() => handleEnroll({roomToken: invi.room.roomToken, action:"rejected"})} variant="danger">
                                        {enrolling !== `${invi.room.roomToken}:rejected` ? <FaTimes/> : <FaSpinner className="icon-spin"/>}
                                    </Button>
                                </ButtonGroup>
                            </Col>
                        </Row>
                    </li>      
                ))}
            </ul>
        </>
    )
}

export default GoGoUserRoomInvitations
