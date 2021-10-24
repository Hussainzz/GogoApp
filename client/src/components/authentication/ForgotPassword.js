import React,{useRef,useState,useEffect} from 'react';
import {Form,Button,Card,Alert} from 'react-bootstrap'
import { Link, useHistory} from 'react-router-dom';
import {useSelector, useDispatch} from 'react-redux';
import CenteredContainer from './CenteredContainer';
import { forgotPasswordAsync, resetAuthState } from '../../redux/authSlice';

import Spinner from '../common/Spinner';


const ForgotPassword = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const {authToken, loading, authErrors,successMessage} = useSelector(state => state.auth);

    if(authToken){
        history.push('/dashboard')
    }

    const formRef = useRef();
    const emailRef = useRef();

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
        if(!emailRef.current.value){
            return setError('Please enter your email address'); 
        }
        try {
            setError(''); 
            dispatch(forgotPasswordAsync({
                email: emailRef.current.value,
            }))
        } catch (err) {
            setError('Something went wrong!'); 
        }
    }
    
    return (
        <CenteredContainer>
           
            <Card>
                <Card.Body>
                    <h2 className="text-center mb-4">Forgot Password</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                   { authErrors[0] && <Alert variant="danger">{authErrors[0].msg}</Alert> }
                   { successMessage && <Alert variant="success">{successMessage}</Alert> }

                    <Form onSubmit={handleSubmit} ref={formRef}>

                        <Form.Group id="email">
                            <Form.Label>
                                Email
                            </Form.Label>
                            <Form.Control type="email" ref={emailRef}/>
                        </Form.Group>

                        {!loading ? <Button disabled={loading} type="submit" className="w-100 mt-4">Send</Button> :  <Spinner/>}
                    </Form>
                </Card.Body>
            </Card>
            <div className="w-100 text-center mt-2">
                Need an account? <Link to='/signup'>Sign Up</Link>
            </div>
        </CenteredContainer>
    )
}

export default ForgotPassword
