import React,{useEffect,useRef/* ,useState */} from "react";
/* import {  useDispatch } from "react-redux"; */
import '../../css/conf.css';
import {v4 as uuid} from 'uuid';


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
    console.log(props.peer)
    const ref = useRef();
    const k = uuid();
    useEffect(() => {
        if (!!props.peer) {
          props.peer.on("stream", (stream) => {
            ref.current.srcObject = stream;
          });
        }
         // eslint-disable-next-line
      }, []);
    
    return (
        <video key={k} className="userCam" playsInline autoPlay ref={ref} />
    );
}


const Conf = ({roomData, myVideo, currentUserId, answerCall}) => {
/*     const dispatch = useDispatch()
    console.log(socket); */
   
   /*  const [peers, setPeers] = useState([]);
    const peersRef = useRef([]); */

    window.addEventListener('resize', () => {
        Dish();
    })

    useEffect(() => {
        Dish();
    },[roomData])

/*     useEffect(() => {
        console.log('got socket effect');
        //if(roomData != null && roomData.joinedUsers.length){
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((currentStream) => {
                myVideo.current.srcObject = currentStream;
                
                socket.on('room-active', (status)=>{
                     console.log(status);

                    const peers = [];
                    const allOtherJoinUsers  = roomData.joinedUsers.filter(u => u.userId != currentUserId);

                    allOtherJoinUsers.forEach(user => {
                        
                        const peer = createPeer(user.socketId, socket.id, currentStream);
                        peersRef.current.push({
                            peerID: user.socketId,
                            peer,
                        })
                        peers.push(peer);
                    
                    });
                    dispatch(addPeersToRoomData(peers))
                })
                   
                
                socket.on("user-joined", payload => {
                    const peer = addPeer(payload.signal, payload.callerID, currentStream);
                    peersRef.current.push({
                        peerID: payload.callerID,
                        peer
                    });
                    dispatch(addPeerToRoomData(peer))
                })

                socket.on('receiving-returned-signal', payload => {
                    const item = roomData.peers.find(p => p.peerID === payload.id);
                    item.peer.signal(payload.signal);
                })
            });
       // }
    }, [socket]); */

/*     function createPeer(userToSignal, callerID, stream){
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream
        })

        peer.on('signal', signal => {
            socket.emit('sending-signal',{userToSignal, callerID, signal})
        })
        return peer
    }

    function addPeer(incomingSignal, callerID, stream){
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream
        });

        peer.on("signal", signal => {
            socket.emit('returning-signal',{signal, callerID})
        })

        peer.signal(incomingSignal)

        return peer;
    } */
  return (
    <>  
        <div id="Dish">
           {
               
                roomData!=null && roomData.joinedUsers.length ? roomData.joinedUsers.map((user,i) => {
                            if(user.userId === currentUserId){
                                return (
                                    <div className="Camera" key={user.socketId} >
                                        <h3 className="p-2">{user.name}</h3>
                                        <video key={user.socketId} className="userCam" playsInline muted autoPlay ref={myVideo}/>
                                    </div>
                                )
                            }else{
                                return ''
                            }
                    }
                )
                : <></>
            }
            {
                roomData!=null && roomData.peers ? roomData.peers.map((peer,i) => (
                    
                    <div className="Camera" key={uuid()} >
                        <Video  peer={peer} answerCall={answerCall} />
                    </div>
                    )
                )
                : <></>
            }
        </div>
    </>
  );
};

export default Conf;
