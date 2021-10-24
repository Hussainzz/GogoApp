import React,{useRef,useState, useEffect} from 'react';
import {Form,Button,Card,Alert} from 'react-bootstrap'
import { Link, useHistory,useLocation } from 'react-router-dom';
import CenteredContainer from './CenteredContainer';
import { useDispatch, useSelector } from 'react-redux';
import { loginAsync } from '../../redux/authSlice';
import Spinner from '../common/Spinner';

const Login = () => {
    const {state} = useLocation();
    //const searchParams = new URLSearchParams(search);
    const dispatch = useDispatch();
    const {authToken,/*  isAuthenticated, */loading, authErrors} = useSelector(state => state.auth);

    const emailRef = useRef();
    const passwordRef = useRef();

    const [error, setError] = useState('');
    //const [loading, setLoading] = useState(false);
    const history = useHistory();

   /*  if(authToken){
        history.push('/dashboard')
    } */
    useEffect(() => {
        if(authToken/*  && isAuthenticated */){
            //console.log(state?.from.pathname || '/dashboard')
            history.push(state?.from.pathname || '/dashboard');
          /*   if(redirectTo !== ''){
                history.push(redirectTo)
            }else{
                history.push('/dashboard')
            } */
        }
         // eslint-disable-next-line
    },[dispatch, authToken/* , isAuthenticated */])

    async function handleSubmit(e){
        e.preventDefault();

        if(emailRef.current.value === ''){
            setError('Please enter your email');
            return;
        }
        if(passwordRef.current.value === ''){
            setError('Please enter your password');
            return;
        }

        try {
            setError(''); 
           // await login(emailRef.current.value, passwordRef.current.value);
            dispatch(loginAsync({
                password: passwordRef.current.value,
                email: emailRef.current.value,
            }))
            //history.push('/');
        } catch (err) {
            setError('Login In Failed'); 
        }
        //setLoading(false)
    }
    return (
        <CenteredContainer>
            <Card>
                <Card.Body>
                    <h1 className="text-center">Welcome to GoGo</h1>
                    <h2 className="text-center mt-4 mb-4">Sign In</h2>
                    {error && <Alert variant="danger">{error}</Alert>}
                    { authErrors[0] && <Alert variant="danger">{authErrors[0].msg}</Alert> }
                    <Form onSubmit={handleSubmit}>
                        <Form.Group id="email">
                            <Form.Label>
                                Email
                            </Form.Label>
                            <Form.Control type="email" ref={emailRef}/>
                        </Form.Group>

                        <Form.Group id="password">
                            <Form.Label>
                                Password
                            </Form.Label>
                            <Form.Control type="password" ref={passwordRef}/>
                        </Form.Group>

                        {!loading ?  <Button disabled={loading} type="submit" className="w-100 mt-4">Login</Button> :  <Spinner/>}

                       
                    </Form>

                    <div className="w-100 text-center mt-3">
                        <Link to="/forgot-password">Forgot Password</Link>
                    </div>
                </Card.Body>
            </Card>
            <div className="w-100 text-center mt-2 d-none">
                Need an account? <Link to='/signup'>Sign Up</Link>
            </div>
        </CenteredContainer>
    )
}

export default Login
