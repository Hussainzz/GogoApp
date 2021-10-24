import React from 'react'
import { useSelector } from 'react-redux'
import '../css/landing.css'
import gogoLogo from '../img/gogo.png'
import { Redirect } from 'react-router-dom'
import { Row,Col,Container,Image,Button } from 'react-bootstrap'

const Landing = () => {
    const {isAuthenticated} = useSelector(state => state.auth)
    if(isAuthenticated){
        return <Redirect to='/login' />
    }
    return <Container fluid="md" className="text-center">
    <Row>
      <Col sm={12}> <Image src={gogoLogo} alt='Welcome to GoGo' fluid /></Col>
      <Col sm={12}>  
        <Button variant="primary" href="/login" className="btn-custom">LogIn</Button>{' '}
      </Col>
    </Row>
  </Container>
}

export default Landing
