import React,{useState} from 'react'
import { Row,Col, Badge,Card,CardColumns,InputGroup,FormControl,Button,ListGroup } from "react-bootstrap";
import { AiOutlineAlignLeft, AiOutlineComment,AiTwotoneNotification } from "react-icons/ai";
import '../../../css/announcements.css'
import { useDispatch } from "react-redux";
import { getRoomAnnouncementsAsync,createAnnouncementCommentAsync } from '../../../redux/roomSlice';
import Spinner from '../../common/Spinner';
import Moment from 'react-moment';

const GoGoAnnouncement = ({rToken, roomAnnouncements, hasMoreAnnouncements,fetchingAnnouncements}) => {
    const dispatch = useDispatch();
    const [announcementPage, setAnnouncementPage] = useState(1);
    const [hideShowComments, setHideShowComments] = useState({});

    const [comments, setComments] = useState({comments: {}});

  /*   const onChange = e => {
        if(e.target.value !== '') setError(null);
        setComments({ ...comments, [e.target.name]: e.target.value });
    }

    const handleChange = (e) => {
        setComment(e.target.value);
    } */

    const handleCommentChange = (e) => {
        const c = e.target.value;
        const aId = e.target.id;
        const com = {...comments};
        com['comments'][aId] = c;
        setComments(com);
    }

    const onSubmitComment = (aId) => {
        if(!comments['comments'].hasOwnProperty(aId) || comments['comments'][aId] === ''){
            return;
        }

        dispatch(createAnnouncementCommentAsync({
            announcement: aId,
            message: comments['comments'][aId],
            roomToken:rToken
        }));
    }

    const hideCommentsHandler = id => {
        setHideShowComments(prevShownComments => ({
          ...prevShownComments,
          [id]: !prevShownComments[id]
        }));
      };

    const loadMoreAnnouncements = async() => {
        let newP = announcementPage+1;
        dispatch(getRoomAnnouncementsAsync({r:rToken,p:newP}));
        setAnnouncementPage(newP);
    }

    return (
        <>
         <div className="d-flex flex-column flex-grow-1 mt-3" style={{ height: '90vh' }}>

            {roomAnnouncements !== null && roomAnnouncements.length? 
                <CardColumns className="mt-4">
                    {roomAnnouncements.map((a, idx) =>
                        (
                            <Card className="mt-3" key={idx}>
                               <div className="pt-2 px-3"><AiOutlineAlignLeft /></div>
                               <Card.Body>
                                   <Card.Title>{a.title}</Card.Title>
                                   <div>
                                       <Row>
                                           <Col>
                                           {a.description}.{' '}
                                           </Col>
                                       </Row>
                                       <Row className="pt-3">
                                           <Col className="commentBadge" onClick={() => hideCommentsHandler(a._id)}>
                                               <AiOutlineComment/>{' '}Comments{' '}
                                               <Badge bg="dark" className="bg-dark">
                                               {a.comments.length}
                                               </Badge>
                                           </Col>
                                       </Row>
                                       {hideShowComments.hasOwnProperty(a._id) && !hideShowComments[a._id] && <Row className="pt-3 hideCommentsClass" >
                                               <Col className="">
                                               <ListGroup variant="flush">
                                                   {a.comments.length?
                                                       a.comments.map(comment => (
                                                            <ListGroup.Item key={comment._id}>
                                                                <Row>
                                                                    <Col xs={10}>
                                                                    {comment.message}
                                                                    </Col>
                                                                    <Col xs={2}>
                                                                        <small className="text-muted">{comment.sender.name}{' '}
                                                                        <Moment format="YYYY-MM-DD HH:mm">
                                                                            {comment.createdAt}
                                                                        </Moment>
                                                                        </small>
                                                                    </Col>
                                                                </Row>
                                                            </ListGroup.Item>
                                                       ))
                                                    :
                                                        <p>No Comments</p>    
                                                    }
                                               </ListGroup>
                                               </Col>
                                           </Row>}
                                           
                                       <Row className="commentBoxRow pt-3">
                                           <Col>
                                           <InputGroup className="mb-3">
                                               <FormControl
                                               placeholder="Add your comment here"
                                               aria-label="Add your comment here"
                                               aria-describedby="basic-addon2"
                                               value={comments[a._id]}
                                               id={a._id}
                                               onChange={e => handleCommentChange(e)}
                                               />
                                               <Button variant="outline-secondary" id={`commentBtn${a._id}`} onClick={()=> onSubmitComment(a._id)}>
                                               Comment
                                               </Button>
                                           </InputGroup>
                                           </Col>
                                       </Row>
                                   </div>
                               </Card.Body>
                               <Card.Footer>
                                   <small className="text-muted">By {a.announcementBy.name} {'  '} 
                                        <Moment format="YYYY-MM-DD HH:mm">
                                            {a.createdAt}
                                        </Moment>
                                   </small>
                               </Card.Footer>
                           </Card>
                       )
                    )}
                </CardColumns>
               :
               <div style={{padding:'250px',opacity:'0.3'}}>
                <h4>No Announcements...</h4>
                <AiTwotoneNotification style={{fontSize:'40px'}}/>
             </div> 
            }

            {roomAnnouncements !== null && roomAnnouncements.length && hasMoreAnnouncements ?
                <div className="my-1 d-flex flex-column align-self-center align-items-end">
                    {!fetchingAnnouncements ?
                        <span className="loadMore p-4" onClick={loadMoreAnnouncements}>
                            click to load more announcements...
                        </span>
                        : <Spinner/>
                    }
                </div>
                :''
            } 
            </div>
        </>
    )
}

export default GoGoAnnouncement
