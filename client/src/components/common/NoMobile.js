import React from 'react'
import { Image } from 'react-bootstrap'
import gogoLogo from '../../img/gogo.png'
import logo from '../../img/uglyz.gif'
import CenteredContainer from '../authentication/CenteredContainer'

const NoMobile = () => {
    return (
        <div className="bg-primary">
        <CenteredContainer>
            <div className="text-center ">
            <Image src={gogoLogo} fluid />
                <h1 className="p-4">Its Ugly On Phone</h1>
                <img src={logo} alt="loading..." />
            </div>
        </CenteredContainer>
        </div>
        
    )
}

export default NoMobile
