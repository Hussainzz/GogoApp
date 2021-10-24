import React,{useState,useEffect,useRef} from 'react';
import {io} from 'socket.io-client';
import {useSelector, useDispatch} from 'react-redux';
import { toast } from 'react-toastify';
import { FaBell,FaSpinner} from "react-icons/fa";
import CreatableSelect from 'react-select/creatable';
//import axios from 'axios';
import NavBarComponent from '../common/NavBarComponent';
import CenteredLoader from '../common/CenteredLoader';
import { Container,Row,Col,Dropdown,Badge, InputGroup, Button,FormControl,OverlayTrigger, Tooltip,Form } from 'react-bootstrap';
import '../../css/rooms.css';
import { createRoomAsync, getUserRoomsAsync, getUserEnrolledRoomsAsync, getUserRoomInvitationsAsync, resetRoomErrors } from '../../redux/roomSlice';
import GoGoUserRooms from './GoGoUserRooms';
import Spinner from '../common/Spinner';
import NotificationList from '../common/NotificationList';
import '../../css/notification.css'
import { getNotificationsAsync, resetNotificationErrors, addNewNotificationData,markAsRead,markNotificationAsReadAsync } from '../../redux/notificationSlice';
import {useHistory} from 'react-router-dom';
import GoGoUserRoomInvitations from './GoGoUserRoomInvitations';
import { checkRooJoin } from '../../helpers/api';
import GoGoUserEnrolledRooms from './GoGoUserEnrolledRooms';

const components = {
    DropdownIndicator: null,
  };
  
  const createOption = (label) => ({
    label,
    value: label,
  });
  

const GoGoRooms = () => {
    const participantLimit = 3;
    const history = useHistory();
    const dispatch = useDispatch();
    const {authToken, isAuthenticated} = useSelector(state => state.auth);
    const {currentUserId,name} = useSelector(state => state.currentUser);
    const {userRooms, loading, errors, fetchingRooms,userRoomInvitations, fetchingRoomInvitations, enrolledRooms, fetchingEnrolledRooms} = useSelector(state => state.rooms);

    const {notificationData, errors: notificationErrors,notificationCount} = useSelector(state => state.notifications);


    const [socket, setSocket] = useState();

    const [newRoomName, setNewRoomName] = useState('');
    const [participant, setParticipant] = useState('');
    const [participantsList, setParticipantsList] = useState([]);
    const [isRoomPrivateCheck, setIsRoomPrivateCheck] = useState(false);
    const [checkingJoinRoom, setCheckingJoinRoom] = useState(false);
    const [checkRoomDone, setCheckRoomDone] = useState(false);

    const joinRoomToken = useRef('');

    useEffect(() => {
        if(!isAuthenticated) return;
        const s  = io(process.env.REACT_APP_API_URL)
        setSocket(s);

        return () => {
            s.disconnect()
        }
    },[isAuthenticated])

    useEffect(() => {
      if(!isAuthenticated) return;
      dispatch(getUserRoomsAsync())
    },[dispatch,isAuthenticated])

    useEffect(() => {
        if(authToken === null) return;
        dispatch(getNotificationsAsync());
        dispatch(getUserRoomInvitationsAsync());
        dispatch(getUserEnrolledRoomsAsync());
    },[dispatch,authToken])

    useEffect(() => {
        if(errors !== null && errors.length > 0){
            toast.error(errors[0], {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            dispatch(resetRoomErrors())
        }
    },[dispatch,errors])

    useEffect(() => {
        if(notificationErrors !== null && notificationErrors.length > 0){
            toast.error(notificationErrors[0], {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            dispatch(resetNotificationErrors())
        }
    },[dispatch,notificationErrors])



    const createNewRoom = () => {
        if(newRoomName === ''){
            toast.error(`Please enter a room name`, {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                });
            return;
        }
        if(participantsList.length >= participantLimit){
            toast.error(`Only ${participantLimit} can be added`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                });
            return;
        }

        dispatch(createRoomAsync({
            roomName:newRoomName,
            roomParticipants:(participantsList.length > 0)?participantsList.map(({ value }) => value):[],
            isRoomPrivate:isRoomPrivateCheck
        }))

        setNewRoomName('');
        setParticipant('');
        setParticipantsList([]);

    }

    const handleChange = (e) => {
        setNewRoomName(e.target.value);
    }

      const handleChangeP = (participantsList, actionMeta) => {
        setParticipantsList(participantsList);
      };
      const handleInputChange = (participant) => {
        setParticipant(participant);
      };
      const handleKeyDown = (event) => {
        if (!participant) return;

        switch (event.key) {
          case 'Enter':
          case 'Tab':
            setParticipant('');
            setParticipantsList(pvalue => [...pvalue, createOption(participant)]);
            event.preventDefault();
            break;
           default:
               return; 
        }
      };



    useEffect(() => {
        if(socket == null){
            return;
        } 
        if(currentUserId != null){
            socket.emit('addOnlineUser',{
                userId: currentUserId
            })
        }
        
    },[socket,currentUserId])

    useEffect(() => {
        if(socket == null){
            return;
        } 
       socket.on('invitedToRoom',(data) =>{
            const newNotification = JSON.parse(data);
            toast.info(`💬 ${newNotification.message}`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            dispatch(addNewNotificationData(newNotification))
            dispatch(getUserRoomInvitationsAsync());
       })
        
    },[dispatch,socket]);

/*     useEffect(() => {
      if(!canJoinRoomLoading && canJoinRoom && joinRoomToken.current.value !== ''){
          history.push(`/gogo-room/${joinRoomToken.current.value}`)
      } 
    },[canJoinRoomLoading,canJoinRoom]) */

    useEffect(() => {
        if (checkRoomDone) {
            history.push(`/gogo-room/${joinRoomToken.current.value}`)
        }
    },[checkRoomDone,history]);

    const joinRoomHandler = async (e) => {
        e.preventDefault();
        if(joinRoomToken.current.value === '') return
        // dispatch(checkCanJoinRoomAsync(joinRoomToken.current.value))
        setCheckingJoinRoom(true);
        try{
            const roomJoin = await checkRooJoin(joinRoomToken.current.value)
            if(roomJoin && roomJoin.status === 'success' && roomJoin.canJoin){
                setCheckRoomDone(true);
            }else{
                toast.error(`Please check your room token`, {
                    position: "bottom-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        }catch(err){
            toast.error(`Please check your room token`, {
                position: "bottom-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
        setCheckingJoinRoom(false);
    }

    const handlePrivateRoomChange = (v) => {
        setIsRoomPrivateCheck(v)
        if(!v){
            setParticipantsList([]);
        }
    }
    return (
        <div>
            {name ?
            <>
                <NavBarComponent name={name.split(' ')[0]}/>
                
                <Container className="mt-4">
                    <Row>
                        <Col sm={4} className="float-left">
                            <InputGroup className="mb-3">
                                <FormControl
                                placeholder="Enter Room Token To Join"
                                aria-label="Enter Room Token To Join"
                                aria-describedby="basic-addon2"
                                ref={joinRoomToken}
                                />
                               
                                <Button variant="dark" id="joinWithToken" onClick={joinRoomHandler} disabled={checkingJoinRoom}>
                                   {checkingJoinRoom && (<FaSpinner className="icon-spin"/>)}
                                   {!checkingJoinRoom && (<span>Join Room</span>)}
                                </Button>
                            </InputGroup>
                        </Col>
                        <Col md={{ span: 2, offset: 6 }} className="float-right">
                            <Dropdown >
                                <Dropdown.Toggle className="btn-sm " id="dropdown-button-dark-example1" variant="secondary">
                                <FaBell/> <Badge bg="primary">{notificationCount?notificationCount:0}</Badge>
                                </Dropdown.Toggle>

                                <Dropdown.Menu variant="dark" className="notificationMenu ">
                                    {(notificationData != null && notificationData.length) ?
                                        <NotificationList notifications={notificationData} markAsRead={markAsRead} markNotificationAsReadAsync={markNotificationAsReadAsync}/> :
                                        <Dropdown.ItemText>No new notifications</Dropdown.ItemText>
                                    }
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                    </Row>
                    <Row className="pt-4">
                        <Col  md>
                            <div className="room new">
                                <input className="border border-dark mt-3 mb-3 rounded-1 p-2" placeholder="Enter your room name" onChange={handleChange} value={newRoomName}/>
                              {/*   <input className="input"
                                    placeholder="Enter GoGo users email to invite"
                                    value={participant}
                                    onChange={handleParticipantsChange}
                                    onKeyDown={handleKeyDown}
                                /> */}

                            <CreatableSelect
                                    className={isRoomPrivateCheck?'':'d-none'}
                                    components={components}
                                    inputValue={participant}
                                    isClearable
                                    isMulti
                                    menuIsOpen={false}
                                    onChange={handleChangeP}
                                    onInputChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="enter gogo email and press enter..."
                                    value={participantsList}
                                />


                         {/*        {participantsList.map((email,index) => <div className="tag-item mt-2" key={index}>{email}  
                                <button
                                    className="button"
                                    type="button"
                                    onClick={() =>  handleDeleteParticipant(email)}
                                    >
                                    &times;
                                </button> </div>)} */}
                                <Form.Check 
                                    className="mb-3 mt-3"
                                    type={'checkbox'}
                                    id={`private-room-checkbox`}
                                    label={`Private room (users invited only)`}
                                    checked={isRoomPrivateCheck}
                                    onChange={(ev) => handlePrivateRoomChange(ev.target.checked)}
                                />
                                <div className="rooms-footer">
                                    {userRooms && userRooms.length >= participantLimit ?

                                        <OverlayTrigger placement="left" overlay={<Tooltip id="tooltip-disabled">Only 3 Rooms Can Be Created</Tooltip>}>
                                            <span className="d-inline-block">
                                                <Button variant="default" className="save" disabled style={{ pointerEvents: 'none' }}>
                                                    Create Room
                                                </Button>
                                            </span>
                                        </OverlayTrigger>
                                        
                                        :
                                        !loading ? <button className="save" onClick={createNewRoom}>Create Room</button> :  <Spinner/>
                                    }
                                      
                                </div>


                            </div>
                        </Col>
                        {userRooms && !fetchingRooms? <GoGoUserRooms userRooms={userRooms}/> :  <Spinner/>}
                        
                    </Row>

                    <Row className="mt-4">
                        <Col>
                            <h3>Enrolled Rooms</h3>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={8}>
                            {fetchingEnrolledRooms !== null && fetchingEnrolledRooms ? <Spinner/>
                                :
                                 !fetchingEnrolledRooms && enrolledRooms !== null && enrolledRooms.length?
                                    <GoGoUserEnrolledRooms enrolledRooms={enrolledRooms} loadingEnrolledRooms={fetchingEnrolledRooms}/>
                                :
                                    <p>No Enrolled Rooms</p> 
                            }
                        </Col>

                        <Col xs={4}>
                            <h6>Room Invites</h6>
                            {fetchingRoomInvitations !== null && fetchingRoomInvitations ? <Spinner/>
                                :
                                 !fetchingRoomInvitations && userRoomInvitations !== null && userRoomInvitations.length?
                                    <GoGoUserRoomInvitations invitations={userRoomInvitations} loadingInvi={fetchingRoomInvitations}/>
                                :
                                    <p>No Invites</p> 
                            }
                        </Col>
                    </Row>
                </Container>

            </>
            :<CenteredLoader/>}
        </div>
    )
}

export default GoGoRooms
