import React from 'react'
import logo from '../../img/roomFull.gif'
import CenteredContainer from '../authentication/CenteredContainer'

const roomFull = () => {
    return (
        <div className="bg-primary">
        <CenteredContainer>
            <div className="text-center ">
                <img src={logo} alt="loading..." />
                <h1 className="p-4">Sorry Room Is Full</h1>
            </div>
        </CenteredContainer>
        </div>
        
    )
}

export default roomFull
