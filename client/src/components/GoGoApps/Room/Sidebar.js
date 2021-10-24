import React, { useState } from 'react'
import { Tab, Nav, Button,OverlayTrigger,Tooltip,Modal } from 'react-bootstrap'
import People from './People'
import { IoMdExit } from "react-icons/io";
import AnnouncementModal from './AnnouncementModal';
import '../../../css/modal.css'

const NOTIFICATIONS_KEY = 'notifications'
const JOINED_USERS_KEY = 'people'

export default function Sidebar({ roomToken,roomData,leaveRoom,currentUserId }) {
  const [activeKey, setActiveKey] = useState(JOINED_USERS_KEY)
  const [modalOpen, setModalOpen] = useState(false)
  
  function closeModal() {
    setModalOpen(false)
  }

  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      Leave Room
    </Tooltip>
  );

  return (
    <div style={{ width: '250px' }} className="d-flex flex-column">
      <Tab.Container activeKey={activeKey} onSelect={setActiveKey}>
        <Nav variant="tabs" className="justify-content-center">
          <Nav.Item>
            <Nav.Link eventKey={JOINED_USERS_KEY}>People</Nav.Link>
          </Nav.Item>
          {/* <Nav.Item>
            <Nav.Link eventKey={NOTIFICATIONS_KEY}>Notifications</Nav.Link>
          </Nav.Item> */}
        </Nav>
        <Tab.Content className="border-end overflow-auto flex-grow-1">
         {/*  <Tab.Pane eventKey={NOTIFICATIONS_KEY}>
                <h4>All room notifications here</h4>
          </Tab.Pane> */}
          <Tab.Pane eventKey={JOINED_USERS_KEY}>
                <People roomData={roomData} currentUserId={currentUserId}/>
          </Tab.Pane>
        </Tab.Content>
        <div className="p-2 border-top border-end small">
          Room Token: <span className="text-muted">{roomToken}</span>
        </div>

        <div className="p-2 border-top border-end small">
          <OverlayTrigger
              placement="right"
              delay={{ show: 250, hide: 400 }}
              overlay={renderTooltip}
            >
              <Button className="float-end" variant="danger" size="sm" onClick={leaveRoom}>
                <IoMdExit/>
              </Button>
            </OverlayTrigger>
        </div>

        
        <Button onClick={() => setModalOpen(true)} className="rounded-0">
          New Announcement
        </Button>
      </Tab.Container>

      <Modal show={modalOpen} onHide={closeModal} enforceFocus={false}>
          <AnnouncementModal closeModal={closeModal} rToken={roomToken}/>
      </Modal>
    </div>
  )
}
