import React from 'react'
import { ListGroup } from 'react-bootstrap'
import {capitalizeFirstLetter} from '../../../helpers/upperFirst';
export default function People({roomData, currentUserId}) {
  return (
    <ListGroup variant="flush">
     {
         roomData && roomData.joinedUsers.length &&
            roomData.joinedUsers.map((rData) => (
                <ListGroup.Item
                key={rData.userId}
                action
                /* onClick={() => selectConversationIndex(index)}
                active={conversation.selected} */
                >
                {capitalizeFirstLetter(rData.name)} {' '} {currentUserId === rData.userId ? '(You)' :''}
                </ListGroup.Item>
            ))
     }
    </ListGroup>
  )
}