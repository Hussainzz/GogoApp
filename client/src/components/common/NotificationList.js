import React from 'react'
import { FaTimesCircle } from "react-icons/fa";
import '../../css/notification.css'
import Moment from 'react-moment';
import { useDispatch } from 'react-redux';

const NotificationList = ({notifications,markAsRead,markNotificationAsReadAsync}) => {
    const dispatch = useDispatch();
    const handleMarkRead = (id) => {
        dispatch(markAsRead(id));
        dispatch(markNotificationAsReadAsync({notificationId: id}));
    }

    return (
        <div className="" onClick={(e) =>  e.stopPropagation()  }>
		<section className="notif-section">

			<div className="notif-header">Notifications
				<input type="button" className="three-dot"/>
			</div>

			<div className="notif-body">

                {notifications.length ?
                    notifications.map((notification,i) => (
                        <div className="notif-list-item" key={i}>
                            <div className="notif-content">
                                <div className="notif-text">
                                    {notification.message}
                                </div>
                                <div className="notif-meta">
                                   
                                    <span className="notif-time"><Moment format="LLL">{notification.created_at}</Moment></span>
                                </div>
                            </div>
                            <div className="notif-dp">
                                <FaTimesCircle className="float-right notificationItemCursor" onClick={
                                    () => { 
                                        handleMarkRead(notification._id)
                                    }
                                } />
                            </div>
                        </div>
                    ))
               : <></> }
			</div>

		</section>
	</div>
    )
}

export default NotificationList
