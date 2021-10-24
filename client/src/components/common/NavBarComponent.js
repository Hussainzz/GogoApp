import React from 'react'
import '../../css/navbar.css'
import { Navbar, Nav, Container } from 'react-bootstrap';
import gogoLogo from '../../img/gogo.png'
import { useDispatch } from 'react-redux';
import { logoutAsync } from '../../redux/authSlice';

const NavBarComponent = ({name}) => {
    const dispatch = useDispatch();

    const handleLogout = (e) =>{
        e.preventDefault();
        dispatch(logoutAsync());
    }
    return (
        <>
            <Navbar collapseOnSelect fixed='top' expand='sm' bg='dark' variant='dark' className="sticky-nav">
                <Container>
                <Navbar.Brand href='/dashboard' className="ml-0">
                    <img
                    alt=""
                    src={gogoLogo}
                    width="90"
                    height="50"
                    className="d-inline-block align-top"
                    />
                </Navbar.Brand>
                    <Navbar.Toggle aria-controls='responsive-navbar-nav'/>
                    <Navbar.Collapse id="responsive-navbar-nav">
               
                        <Nav className="justify-content-end" style={{ width: "100%" }}>
                            <Nav.Link href='#'>Hello,{name}</Nav.Link>
                            <Nav.Link href="#" onClick={handleLogout}>Logout</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </>
    )
}

export default NavBarComponent
