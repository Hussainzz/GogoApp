import React/* ,{useEffect} */ from 'react';
import {isMobile} from 'react-device-detect';
import {BrowserRouter as Router, Switch, Route} from 'react-router-dom'
//import {useDispatch, useSelector} from 'react-redux'
//import { getLoggedInUserAsync } from '../redux/userSlice';
import Login from './authentication/Login';
import PrivateRoute from './authentication/PrivateRoute';
import Signup from './authentication/Signup';
import Dashboard from './Dashboard';
import Landing from './Landing';
//import { setAuthToken } from '../redux/authSlice';
import ForgotPassword from './authentication/ForgotPassword';
import ResetPassword from './authentication/ResetPassword';
import PageNotFound from './common/PageNotFound';
import GoGoRooms from './GoGoApps/GoGoRooms';
//import GoGoConfRoom from './GoGoApps/GoGoConfRoom';
import roomFull from './common/roomFull';
import GoGoRoomDashboard from './GoGoApps/GoGoRoomDashboard';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import NoMobile from './common/NoMobile';


function App() {

/*   const dispatch = useDispatch();
  const {authToken} = useSelector(state => state.auth);

  useEffect(() => {
    if(authToken !== null){
        dispatch(setAuthToken({authToken}))
        dispatch(getLoggedInUserAsync())
    }
  },[dispatch,authToken]) */

  return (
    <>
      {isMobile?
        <NoMobile/>
        :
        <>
          <ToastContainer position="top-right" autoClose={1000} />
          <Router>
            <Switch>
              <Route path="/" exact component={Landing}/>
              <PrivateRoute exact path="/dashboard"  component={Dashboard}/>
              <PrivateRoute exact path="/gogo-rooms"  component={GoGoRooms}/>
              <PrivateRoute exact path="/gogo-room/:roomToken"  component={GoGoRoomDashboard}/>

              <Route path="/login" exact component={Login}/>
              <Route path="/signup" exact component={Signup}/>
              <Route path="/forgot-password" exact component={ForgotPassword}/>
              <Route path="/reset-password/:resetPasswordToken" exact component={ResetPassword}/>

              <Route path="/room-full" exact component={roomFull}/>      
              <Route component={PageNotFound} /> 
            </Switch>
          </Router>
        </>
      }
    </>
  );
}

export default App;
