import React, { useState, useEffect, useRef } from "react";
import chatSound from '../../assets/sounds/chat.mp3'
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import {
  getRoomData,
  updateDiscussionMessages,
  getRoomDiscussionMessagesAsync,
  resetRoomState,
  checkCanJoinRoomAsync,
  resetNewAnnouncementMsg,
  getRoomAnnouncementsAsync,
  addNewAnnouncements,
  addNewAnnouncementComment
} from "../../redux/roomSlice";
import { Tab, Nav, Badge } from "react-bootstrap";
import Sidebar from "./Room/Sidebar";
import Chat from "./Room/Chat";
import { capitalizeFirstLetter } from "../../helpers/upperFirst";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import CenteredLoader from "../common/CenteredLoader";
import GoGoAnnouncement from "./Room/GoGoAnnouncement";
import Spinner from '../common/Spinner'

const OVERVIEW_KEY = "overview";
const DISCUSSION_KEY = "discussion";

const GoGoRoomDashboard = ({ match }) => {
  const audio = new Audio(chatSound)
  const history = useHistory();

  const overviewNavLink = useRef();
  const [activeKey, setActiveKey] = useState(OVERVIEW_KEY);

  const roomToken = match.params.roomToken;

  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { currentUserId, name } = useSelector((state) => state.currentUser);
  const { roomData, 
    discussionData,
    hasMoreDiscussionMessages,
    loadingMoreMessages,
    canJoinRoom,
    canJoinRoomLoading,
    newAnnouncementMsg,
    roomAnnouncements, 
    fetchingAnnouncements,
    hasMoreAnnouncements,
    firstAnnouncementLoad,
  } = useSelector((state) => state.rooms);

  const [socket, setSocket] = useState();

  useEffect(() => {
    if(!isAuthenticated) return;
      //${process.env.REACT_APP_API_URL}
      const s = io(`${process.env.REACT_APP_API_URL}/rooms`);
      setSocket(s);
  
      return () => {
        s.disconnect();
      };
    
   
  }, [isAuthenticated]);

  useEffect( () => {
    if(isAuthenticated){
    dispatch(checkCanJoinRoomAsync(roomToken))
    }
  },[dispatch,roomToken, isAuthenticated])


  //Join Room With Token
  useEffect(() => {
    if (socket == null) {
      return;
    }
    if(canJoinRoom){
      if (currentUserId !== null && roomToken !== null) {
        const roomData = {
          room: roomToken,
          userId: currentUserId,
          name: name,
        };

        socket.emit("join-room", roomData, (status) => {
          console.log(status);
        });

        socket.on("room-info", (roomInfo) => {
        /*  const rInfo = JSON.parse(roomInfo).joinedUsers.filter(
            (user) => user.socketId !== socket.id
          ); */
          //console.log(rInfo)
        });
      }
    }else{
      if(!canJoinRoomLoading){
        dispatch(resetRoomState());
        history.push("/gogo-rooms");
      }
    }
  }, [socket, currentUserId, name, roomToken, canJoinRoom,canJoinRoomLoading,dispatch,history]);

  //Join Room With Token
  useEffect(() => {
    if (socket == null) {
      return;
    }
    socket.on("room-info", (roomInfo) => {
      dispatch(getRoomData(roomInfo));
      //dispatch(getRoomAnnouncementsAsync({r:roomToken,p:1}))
      //dispatch(getRoomDiscussionMessagesAsync({r:roomToken,p:1}));
    });

    socket.on("fetch-announcements", (msg) => {
      dispatch(getRoomAnnouncementsAsync({r:roomToken,p:1}));
    });

    socket.on("post-new-announcement", (announcement) => {
      dispatch(addNewAnnouncements(announcement));
    });

    socket.on("room-discussion-info", (m) => {
      dispatch(getRoomDiscussionMessagesAsync({r:roomToken,p:1}));
    });

    socket.on("receive-new-discussion-message", (newMessage) => {
      //console.log(newMessage);
      
      dispatch(updateDiscussionMessages(newMessage));
    });

    socket.on('update-new-comment', (newComment) => {
     dispatch(addNewAnnouncementComment(newComment));
    });

    socket.on("user-joined-room", (s) => {
      //console.log('somone joined');
      toast.info(`${capitalizeFirstLetter(s.name)} joined the room`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    });

    socket.on("new-message", (s) => {
      if(overviewNavLink.current.classList.contains('active')){
        
        audio.play();
      }
    });
    /*   socket.on("room-full", (s) => {
        history.push('/room-full')
    }); */
    // eslint-disable-next-line
  }, [socket, dispatch,roomToken]);

  useEffect(() => {
    if(newAnnouncementMsg !== ''){
      toast.success(newAnnouncementMsg, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
     });
      dispatch(resetNewAnnouncementMsg())
    }
  },[dispatch, newAnnouncementMsg]);

  function sendDiscussionMessage(message) {
    socket.emit("new-discussion-message", roomToken, message, {
      userId: currentUserId,
      name: name,
    });
  }

  function leaveRoom(){
      dispatch(resetRoomState());
      socket.emit('leaveRoom');
      history.push("/gogo-rooms")
  }

  return (
    <>
      {!canJoinRoomLoading ?
        <div className="d-flex" style={{ height: "100vh" }}>
          <Sidebar roomData={roomData} roomToken={roomToken} leaveRoom={leaveRoom} currentUserId={currentUserId}/>
          <div className="flex-grow-1 m-3">
            <Tab.Container activeKey={activeKey} onSelect={setActiveKey}>
              <Nav variant="pills" className="">
                <Nav.Item>
                  <Nav.Link eventKey={OVERVIEW_KEY} ref={overviewNavLink}>Overview</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey={DISCUSSION_KEY}>
                    Discussion{" "}
                    {discussionData && discussionData.length ? (
                      <Badge bg="dark" className="bg-dark">
                        {discussionData.length}
                      </Badge>
                    ): <Badge bg="dark" className="bg-dark">
                    0
                  </Badge>}
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content className="overflow-auto flex-grow-1">
                <Tab.Pane eventKey={OVERVIEW_KEY}>
                      {!firstAnnouncementLoad?
                          <div style={{padding:'250px'}}>
                              <Spinner/>
                          </div>
                      :<GoGoAnnouncement fetchingAnnouncements={fetchingAnnouncements} rToken ={roomToken} roomAnnouncements ={roomAnnouncements} hasMoreAnnouncements={hasMoreAnnouncements}/>}  
                </Tab.Pane>
                <Tab.Pane eventKey={DISCUSSION_KEY}>
                  <Chat
                    currentUserId={currentUserId}
                    discussionData={discussionData}
                    sendDiscussionMessage={sendDiscussionMessage}
                    rToken ={roomToken}
                    hasMoreDiscussionMessages={hasMoreDiscussionMessages}
                    loadingMoreMessages={loadingMoreMessages}
                  />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </div>
        </div>
        :
      <CenteredLoader/>
      } 
    </>
  );
};

export default GoGoRoomDashboard;
