import React, { useState,useEffect,useRef,useCallback } from 'react'
import '../../../css/chat.css';
import { Form, InputGroup, Button,Image } from 'react-bootstrap'
import { FaTelegramPlane,FaUpload } from "react-icons/fa";
import { AiFillMessage } from "react-icons/ai";
import Moment from 'react-moment';
import axiosAuthInstance from '../../../helpers/axiosAuthInstance';
import { toast } from 'react-toastify';
import { FcFile } from "react-icons/fc";
//import {saveAs} from 'file-saver'
import { useDispatch } from 'react-redux';
import { getRoomDiscussionMessagesAsync,resetLoadingMoreMessages } from '../../../redux/roomSlice';
import Spinner from '../../common/Spinner';

export default function Chat({currentUserId, discussionData ,sendDiscussionMessage,rToken,hasMoreDiscussionMessages,loadingMoreMessages}) {
  const dispatch = useDispatch();
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const inputFileRef = useRef(null);
  const [page, setPage] = useState(1);
  //const [hasMoreClicked, setHasMoreClicked] = useState(false);

  const setRef = useCallback(node => {
    if (node) {
      node.scrollIntoView({ smooth: true })
    }
  }, [])

  useEffect(() => {
    setFile(document.getElementById("input-file"));
  }, []);

  const handleUpload = () => {
    file.click();
  };

  const uploadDiscussionFile = async (fileToUpload) => {
    try {
        const config = {
            "Content-Type": "multipart/form-data"
          };
        let formData = new FormData();  
        formData.append("discussionFile", fileToUpload)

        const upload = await axiosAuthInstance().post('/api/rooms/discussion/upload',formData,config);
        return upload.data
    } catch (e) {
        return e.response.data;
    }
  }

  const handleDisplayFileDetails = async () => {
    if(inputFileRef.current.files){
      const uploadFile = await uploadDiscussionFile(inputFileRef.current.files[0])
      if(uploadFile.status === 'success'){
        sendDiscussionMessage('/'+uploadFile.data);
      }else{
        toast.error(uploadFile.message, {
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
      
    }else{
      toast.error(`Please select a file`, {
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
  };

  function handleSubmit(e) {
    e.preventDefault();
    if(text === '') return;
    //setHasMoreClicked(false);
    dispatch(resetLoadingMoreMessages())
    sendDiscussionMessage(text)
    setText('');
  }
  const isToday = (date) => {
    const someDate = new Date(date)
    const today = new Date()
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
  }

  const downloadFile = (url, filename) => {
    fetch(url)
        .then(response => {
            response.blob().then(blob => {
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
            });
            //window.location.href = response.url;
    });
  }

/*   const handleDownload = (url, filename) => {
    return
    console.log(`${window.location.origin}${url}`)
    saveAs(
      `${window.location.origin}${url}`,
      filename
    );
  } */

  const renderMessage = (m) => {
    //
    if(m.message.includes('/uploads/discussions/')){
         const fileName = m.message.substring(m.message.lastIndexOf('/') + 1);
        if(m.message.includes('.jpg')||m.message.includes('.jpeg')||m.message.includes('.png')){
            return <Image onClick={() => downloadFile(m.message, fileName)} src={m.message}  width={250}/>
        }else{
           return <Button onClick={() => downloadFile(m.message, fileName)}><FcFile/></Button>
        }
    }else{
      return m.message
    }
  }

  const loadMoreMessages = async() => {
    //await setHasMoreClicked(true);
    let newP = page+1;
    dispatch(getRoomDiscussionMessagesAsync({r:rToken,p:newP}));
    setPage(newP);
  }
  
  return (
    <>
    <div className="d-flex flex-column flex-grow-1 mt-3" style={{ height: '90vh' }}>
      <div className="flex-grow-1 overflow-auto">
        <div className="d-flex flex-column align-items-start justify-content-end px-3"  >
        {discussionData !== null && discussionData.length && hasMoreDiscussionMessages ?
          <div className="my-1 d-flex flex-column align-self-center align-items-end">
           {/*   <span className="loadMore" onClick={loadMoreMessages}>
                    click to load more messages...
                  </span> */}
              {!loadingMoreMessages ?
                <span className="loadMore" onClick={loadMoreMessages}>
                    click to load more messages...
                  </span>
                : <Spinner/>
              }
          </div>
          :''
       }  
        {discussionData !== null && discussionData.length ? discussionData.map((m, index) => {
              const lastMessage = (discussionData.length - 1 === index) && (!loadingMoreMessages)
              return (
                <div
                  ref={lastMessage ? setRef : null}
                  key={index}
                  className={`my-1 d-flex flex-column ${currentUserId === m.sender ? 'align-self-end align-items-end' : 'align-items-start'}`}
                >
                  <div
                    className={`rounded px-2 py-1 ${currentUserId === m.sender ? 'bg-primary text-white' : 'border'}`}>
                    {renderMessage(m)}
                  </div>
                  <div className={`text-muted small ${currentUserId === m.sender ? 'text-right' : ''}`}>
                    {currentUserId === m.sender ? 'You' : m.name}
                    <span className="ps-2"> 
                        {!isToday(m.sentOn) ?
                          <Moment format="YYYY-MM-DD HH:mm">
                            {m.sentOn}
                          </Moment>
                        :
                        <Moment format="HH:mm">
                            {m.sentOn}
                        </Moment>}
                    </span>
                  </div>
                </div>
              )
            }) :
            <div style={{padding:'250px',opacity:'0.3'}}>
              <h4>Start discussion by sending a new message...</h4>
              <AiFillMessage style={{fontSize:'40px'}}/>
            </div>
            }
        </div>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="m-2">
          <InputGroup>
            <Form.Control
              as="textarea"
              required
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ height: '60px', resize: 'none' }}
            />
             <input ref={inputFileRef} className="d-none" type="file" id="input-file" onChange={handleDisplayFileDetails} />
             <Button onClick={handleUpload}><FaUpload/></Button>
             <Button type="submit"><FaTelegramPlane/></Button>
           
          </InputGroup>
        </Form.Group>
      </Form>
    </div>
    </>
  )
}
