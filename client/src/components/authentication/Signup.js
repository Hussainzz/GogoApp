import React,{useRef,useState,useEffect} from 'react';
import {Form,Button,Card,Alert} from 'react-bootstrap'
import { Link, useHistory} from 'react-router-dom';
import {useSelector, useDispatch} from 'react-redux';
import CenteredContainer from './CenteredContainer';
import { registerAsync, resetAuthState } from '../../redux/authSlice';

import Spinner from '../common/Spinner';


const Signup = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const {authToken, loading, authErrors,successMessage} = useSelector(state => state.auth);
    
    if(authToken){
        history.push('/dashboard')
    }

    const formRef = useRef();
    const nameRef = useRef();
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();

    const [error, setError] = useState('');

    useEffect( () => {
        let clearMsg;
        if(successMessage){
            formRef.current.reset();
            clearMsg = setTimeout(() => {
                dispatch(resetAuthState());
            },2000)
        }
        return () => clearTimeout(clearMsg)
    },[successMessage,dispatch])

    async function handleSubmit(e){
        e.preventDefault();
        if(passwordRef.current.value !== passwordConfirmRef.current.value){
            return setError('Passwords do not match'); 
        }
        try {
            setError(''); 
            dispatch(registerAsync({
                name: nameRef.current.value,
                password: passwordRef.current.value,
                email: emailRef.current.value,
            }))
        } catch (err) {
            setError('Registration Failed'); 
        }
    }
    
    return (
        <CenteredContainer>
           
            <Card>
                <Card.Body>
                    <h2 className="text-center mb-4">Sign Up</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                   { authErrors[0] && <Alert variant="danger">{authErrors[0].msg}</Alert> }
                   { successMessage && <Alert variant="success">{successMessage}</Alert> }
                    <Form onSubmit={handleSubmit} ref={formRef}>
                        <Form.Group id="name">
                            <Form.Label>
                                Name
                            </Form.Label>
                            <Form.Control type="text" ref={nameRef} required/>
                        </Form.Group>
                        <Form.Group id="email">
                            <Form.Label>
                                Email
                            </Form.Label>
                            <Form.Control type="email" ref={emailRef} required/>
                        </Form.Group>

                        <Form.Group id="password">
                            <Form.Label>
                                Password
                            </Form.Label>
                            <Form.Control type="password" ref={passwordRef} required/>
                        </Form.Group>

                        <Form.Group id="password-confirm">
                            <Form.Label>
                                Password Confirmation
                            </Form.Label>
                            <Form.Control type="password" ref={passwordConfirmRef} required/>
                        </Form.Group>
                        {!loading ? <Button disabled={loading} type="submit" className="w-100 mt-4">Sign Up</Button> :  <Spinner/>}
                    </Form>
                </Card.Body>
            </Card>
            <div className="w-100 text-center mt-2">
                Already have an account? <Link  to="/login">Log In</Link>
            </div>
        </CenteredContainer>
    )
}

export default Signup
