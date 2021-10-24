import React, { useState, useEffect,useRef } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";
import { IoMdSettings, IoMdExit,IoIosMicOff } from "react-icons/io";
import { FaVideoSlash } from "react-icons/fa";

import CenteredLoader from "../common/CenteredLoader";
import { getRoomData } from "../../redux/roomSlice";
import { Fab, Action } from 'react-tiny-fab';
import 'react-tiny-fab/dist/styles.css';
import Peer from 'simple-peer';
import styled from "styled-components";
import '../../css/conf.css';

import micmute from "../../assets/micmute.svg";
import micunmute from "../../assets/micunmute.svg";
import webcam from "../../assets/webcam.svg";
import webcamoff from "../../assets/webcamoff.svg";
import { useHistory } from "react-router-dom";

const ControlGoGos = styled.div`
  margin: 30px;
  padding: 1px;
  height: 45px;
  background-color: rgba(255, 226, 104, 0.1) !important;
  margin-top: -25.5vh;
  filter: brightness(1);
  z-index: 1;
  border-radius: 6px;
`;

const ControlGoGoSmall = styled.div`
  margin: 10px;
  padding: 2x;
  height: 45px;
  margin-top: -25.5vh;
  filter: brightness(1);
  z-index: 1;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  background-color: rgba(255, 226, 104, 0.1) !important;
`;

const ImgGoGo = styled.img`
  cursor: pointer;
  height: 40px;
  width: 60px;
`;

const ImgGoGoSmall = styled.img`
  height: 40px;
  width:60px;
  text-align: left;
  opacity: 0.5;
`;

const StyledVideo = styled.video`
  width: 100%;
  position: static;
  border-radius: 10px;
  overflow: hidden;
  margin: 1px;
  border: 5px solid gray;
`;

// Area:
function Area(Increment, Count, Width, Height, Margin = 10) {
  let i = 0
  let w = 0;
  let h = Increment * 0.75 + (Margin * 2);
  while (i < (Count)) {
      if ((w + Increment) > Width) {
          w = 0;
          h = h + (Increment * 0.75) + (Margin * 2);
      }
      w = w + Increment + (Margin * 2);
      i++;
  }
  if (h > Height) return false;
  else return Increment;
}
// Dish:
function Dish() {
  // variables:
      let Margin = 2;
      let Scenary = document.getElementById('Dish');
      let Width = Scenary.offsetWidth - (Margin * 2);
      let Height = Scenary.offsetHeight - (Margin * 2);
      let Cameras = document.getElementsByClassName('Camera');
      let max = 0;
  
  // loop (i recommend you optimize this)
      let i = 1;
      while (i < 5000) {
          let w = Area(i, Cameras.length, Width, Height, Margin);
          if (w === false) {
              max =  i - 1;
              break;
          }
          i++;
      }
  
  // set styles
      max = max - (Margin * 2);
      setWidth(max, Margin);
}

// Set Width and Margin 
function setWidth(width, margin) {
  let Cameras = document.getElementsByClassName('Camera');
  for (var s = 0; s < Cameras.length; s++) {
      Cameras[s].style.width = width + "px";
      Cameras[s].style.margin = margin + "px";
      Cameras[s].style.height = (width * 0.75) + "px";
  }
}

const Video = (props) => {
  const ref = useRef();

  useEffect(() => {
    props.peer.on("stream", (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);

  return <StyledVideo playsInline autoPlay ref={ref} />;
};


const GoGoRoom = ({ match }) => {

  const history = useHistory();
  
  history.listen((newLocation, action) => {
    if (action === "POP") {
     window.location = "/gogo-rooms";
    }
  });
  

  const roomToken = match.params.roomToken;
  const [gogoPeers, setGogoPeers] = useState([]);

  const dispatch = useDispatch();
  const { authToken } = useSelector((state) => state.auth);
  const { currentUserId, name } = useSelector((state) => state.currentUser);
  const { roomData } = useSelector((state) => state.rooms);
  const [socket, setSocket] = useState();

  const [audioFlag, setAudioFlag] = useState(true);
  const [videoFlag, setVideoFlag] = useState(true);
  const [userUpdate, setUserUpdate] = useState([]);

  const userVideo = useRef();
  const peersRef = useRef([]);
  useEffect(() => {
    //${process.env.REACT_APP_API_URL}
    const s = io(`${process.env.REACT_APP_API_URL}/gogo-conf-room`);
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  window.addEventListener('resize', () => {
    Dish();
  })


  //Join Room With Token
  useEffect(() => {
    if (socket == null) {
      return;
    }
    if (currentUserId !== null && roomToken !== null) {
      const roomData = {
        room: roomToken,
        userId: currentUserId,
        name: name,
      };

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
          userVideo.current.srcObject = currentStream;
          
          socket.emit("join-room", roomData, (status) => {
             console.log(status)
          });

          socket.on("room-info", (roomInfo) => {
            const rInfo = JSON.parse(roomInfo).joinedUsers.filter(user => user.socketId !== socket.id);
            const peers = [];
            rInfo.forEach((d) => {
              const peer = createPeer(d.socketId, socket.id, currentStream,d.name);
              //peersRef.current = peersRef.current.filter((p) => p.peerID != d.socketId);
              peersRef.current.push({
                peerID: d.socketId,
                name: d.name,
                peer,
              });

             // peers = peers.filter((p) => p.peerID != d.socketId);
              peers.push({
                peerID: d.socketId,
                name: d.name,
                peer,
              });
            });
            
            setGogoPeers(peers);
            Dish()
          });

          socket.on("user-joined", (payload) => {
            const peer = addPeer(payload.signal, payload.callerID, currentStream);
            peersRef.current.push({
              peerID: payload.callerID,
              name:payload.name,
              peer,
            });
            const peerObj = {
              peer,
              name:payload.name,
              peerID: payload.callerID,
            };

            
            setGogoPeers((p) => {
              var newPeers = [...p, peerObj];
              var uniquePeers = newPeers.reduce((unique, o) => {
                if(!unique.some(obj => obj.peerID === peerObj.peerID)) {
                  unique.push(o);
                }
                return unique;
              },[]);
              return uniquePeers
            });
            Dish()
          });

          socket.on("user-left", (id) => {
            const peerObj = peersRef.current.find((p) => p.peerID === id);
            if (peerObj) {
              peerObj.peer.destroy();
            }
            const peers = peersRef.current.filter((p) => p.peerID !== id);
            peersRef.current = peers;
            setGogoPeers(peers);
            Dish()
          });

          socket.on("receiving-returned-signal", (payload) => {
            const item = peersRef.current.find((p) => p.peerID === payload.id);
            item.peer.signal(payload.signal);
          });

          socket.on("change", (payload) => {
            setUserUpdate(payload);
          });
            
      }).catch(err => {
          console.log(err)

      })

     
    }
  }, [socket, currentUserId, roomToken, name, dispatch]);


   //Join Room With Token
   useEffect(() => {
    if (socket == null) {
      return;
    }
    socket.on("room-info", (roomInfo) => {
      dispatch(getRoomData(roomInfo));
    });

    socket.on("room-full", (s) => {
      history.push('/room-full')
    });
  }, [socket,dispatch]);


  function createPeer(userToSignal, callerID, stream,name) {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
        name
      });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("returning-signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  return (
    <div>
      {socket !== null? (
        <>
         <Fab
            mainButtonStyles={{
              outline: 'none',
              outline_offset: 'none',
              box_shadow: 'none',
              backgroundColor: '#0d6efd',
          }}
            icon={<IoMdSettings/>}
            alwaysShowTitle={true}
          >
          
            <Action text="Turn Off Camera" style={{
                        outline: 'none',
                        outline_offset: 'none',
                        box_shadow: 'none',
                        backgroundColor: '#dc3545',
                    }}
                    onClick={() => {
                      if (userVideo.current.srcObject) {
                        userVideo.current.srcObject.getTracks().forEach(function (track) {
                          if (track.kind === "video") {
                            if (track.enabled) {
                              socket.emit("change", [...userUpdate,{
                                id: socket.id,
                                videoFlag: false,
                                audioFlag,
                              }]);
                              track.enabled = false;
                              setVideoFlag(false);
                            } else {
                              socket.emit("change", [...userUpdate,{
                                id: socket.id,
                                videoFlag: true,
                                audioFlag,
                              }]);
                              track.enabled = true;
                              setVideoFlag(true);
                            }
                          }
                        });
                      }
                    }}
                    >
                <FaVideoSlash/>
             </Action>
            <Action text="Mute" style={{
                        outline: 'none',
                        outline_offset: 'none',
                        box_shadow: 'none',
                        backgroundColor: '#dc3545',
                    }}
                    onClick={() => {
                      if (userVideo.current.srcObject) {
                        userVideo.current.srcObject.getTracks().forEach(function (track) {
                          if (track.kind === "audio") {
                            if (track.enabled) {
                              socket.emit("change",[...userUpdate, {
                                id: socket.id,
                                videoFlag,
                                audioFlag: false,
                              }]);
                              track.enabled = false;
                              setAudioFlag(false);
                            } else {
                              socket.emit("change",[...userUpdate, {
                                id: socket.id,
                                videoFlag,
                                audioFlag: true,
                              }]);
                              track.enabled = true;
                              setAudioFlag(true);
                            }
                          }
                        });
                      }
                    }}
                    >
                <IoIosMicOff/>
            </Action>
            <Action text="Leave Room" style={{
                        outline: 'none',
                        outline_offset: 'none',
                        box_shadow: 'none',
                        backgroundColor: '#dc3545',
                    }}
                    onClick={()=> window.location = "/gogo-rooms"}
                    >
                <IoMdExit/>
            </Action>
          
          </Fab>
        


          <Container fluid={true}> 
            <Row className='mt-4'>
              <Col xs={12} md={12}>
              <div id="Dish">
                <div className="Camera" key={'someUniqueKey'} >
                  <h2>You</h2>
                  <StyledVideo muted ref={userVideo} autoPlay playsInline />
                  <ControlGoGos>
                    <ImgGoGo
                      src={videoFlag ? webcam : webcamoff}
                      onClick={() => {
                        if (userVideo.current.srcObject) {
                          userVideo.current.srcObject.getTracks().forEach(function (track) {
                            if (track.kind === "video") {
                              if (track.enabled) {
                                socket.emit("change", [...userUpdate,{
                                  id: socket.id,
                                  videoFlag: false,
                                  audioFlag,
                                }]);
                                track.enabled = false;
                                setVideoFlag(false);
                              } else {
                                socket.emit("change", [...userUpdate,{
                                  id: socket.id,
                                  videoFlag: true,
                                  audioFlag,
                                }]);
                                track.enabled = true;
                                setVideoFlag(true);
                              }
                            }
                          });
                        }
                      }}
                    />
                    &nbsp;&nbsp;&nbsp;
                    <ImgGoGo
                      src={audioFlag ? micunmute : micmute}
                      onClick={() => {
                        if (userVideo.current.srcObject) {
                          userVideo.current.srcObject.getTracks().forEach(function (track) {
                            if (track.kind === "audio") {
                              if (track.enabled) {
                                socket.emit("change",[...userUpdate, {
                                  id: socket.id,
                                  videoFlag,
                                  audioFlag: false,
                                }]);
                                track.enabled = false;
                                setAudioFlag(false);
                              } else {
                                socket.emit("change",[...userUpdate, {
                                  id: socket.id,
                                  videoFlag,
                                  audioFlag: true,
                                }]);
                                track.enabled = true;
                                setAudioFlag(true);
                              }
                            }
                          });
                        }
                      }}
                    />
                  </ControlGoGos>
                </div>  
                 {gogoPeers.map((peer, index) => {
                    let audioFlagTemp = true;
                    let videoFlagTemp = true;
                    if (userUpdate) {
                      userUpdate.forEach((entry) => {
                        if (peer && peer.peerID && peer.peerID === entry.id) {
                          audioFlagTemp = entry.audioFlag;
                          videoFlagTemp = entry.videoFlag;
                        }
                      });
                    }
                    return (
                      <div className="Camera" key={peer.peerID} >
                        <h2>{peer.name}</h2>
                        <Video peer={peer.peer} />
                       { <ControlGoGoSmall>
                          <ImgGoGoSmall src={videoFlagTemp ? webcam : webcamoff} />
                          &nbsp;&nbsp;&nbsp;
                          <ImgGoGoSmall src={audioFlagTemp ? micunmute : micmute} />
                        </ControlGoGoSmall>}
                      </div>
                    );
                  })}
              </div>  
              </Col>
            </Row>
          </Container>
        </>
      ) : (
        <CenteredLoader />
      )}
    </div>
  );
};

export default GoGoRoom;
