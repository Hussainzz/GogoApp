import React, { useState } from 'react'
import moment from 'moment';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import { Modal, Form, Button,Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { createAnnouncementAsync } from '../../../redux/roomSlice';
import Spinner from '../../common/Spinner';


export default function AnnouncementModal({ closeModal, rToken }) {

  const dispatch = useDispatch();
  const {loading} = useSelector(state => state.rooms);

  const [error, setError] = useState(null);
  const [schedulePost, setSchedulePost] = useState(false);
  const [scheduleFormData, setScheduleFormData] = useState({
    title:'',
    description:'',
    roomToken:rToken
  });
  const {title, description, roomToken} = scheduleFormData;
  const onChange = e => {
    if(e.target.value !== '') setError(null);
    setScheduleFormData({ ...scheduleFormData, [e.target.name]: e.target.value });
  }
  
  const [schedulePostDate, setSchedulePostDate] = useState('');

  const handleSchedulePostDate = (start, end) => {
    setSchedulePostDate(start.format('MM-DD-YYYY hh:mm A'))
  };


  const handleSchedulePostChange = (v) => {
    setSchedulePost(v)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError(null);
    if(title === ''){
      setError('Please enter title');
      return;
    }
    if(description === ''){
      setError('Please enter description');
      return;
    }
    const announcementData = {
        title,description,roomToken
    }
    if(schedulePost){
        announcementData['schedule'] = schedulePostDate;
    }
    dispatch(createAnnouncementAsync(announcementData))
    closeModal();
  }

  return (
    <>
      <Modal.Header closeButton>New Announcement</Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
            <Form.Label>Title</Form.Label>
            <Form.Control type="text" placeholder="Announcement title" onChange={onChange} name="title"
            value={title}/>
          </Form.Group>
          <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} onChange={onChange} name="description"
            value={description} />
          </Form.Group>

          <Form.Check 
            className="mb-3 mt-3"
            type={'checkbox'}
            id={`schedule-announcement-checkbox`}
            label={`Schedule Announcement`}
            checked={schedulePost}
            onChange={(ev) => handleSchedulePostChange(ev.target.checked)}
          />

          {schedulePost &&  
          <Form.Group>
            <DateRangePicker initialSettings={{
                    singleDatePicker: true,
                    timePicker: true,
                    showDropdowns: true,
                    startDate: moment().format('MM-DD-YYYY'),
                    minDate:  moment().format('MM-DD-YYYY'),
                    minYear:  moment().format('YYYY'),
                    locale: {
                      format: 'MM-DD-YYYY hh:mm A',
                    }
                  }}
                  onCallback={handleSchedulePostDate}
                  >

                  <input type="text" className="form-control col-4" />
            </DateRangePicker>
          </Form.Group>}

         

          <Form.Group className="mt-3">
            {!loading ?  <Button variant="primary" type="submit" onClick={handleSubmit}>
              Post Announcement
            </Button> :  <Spinner/>}
          </Form.Group>
        </Form>
        
      </Modal.Body>
    </>
  )
}
