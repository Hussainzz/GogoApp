import React from 'react'
import logo from '../../img/404.gif'
import CenteredContainer from '../authentication/CenteredContainer'

const PageNotFound = () => {
    return (
        <div className="bg-primary">
        <CenteredContainer>
            <div className="text-center ">
                <img src={logo} alt="loading..." />
                <h1 className="p-4">404 Page not found</h1>
            </div>
        </CenteredContainer>
        </div>
        
    )
}

export default PageNotFound
