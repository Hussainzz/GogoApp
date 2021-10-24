//import { useSelector } from "react-redux";
import React,{useEffect} from 'react';
import { Route, Redirect } from "react-router-dom";
import {useDispatch, useSelector} from 'react-redux'
import { setAuthToken } from '../../redux/authSlice';
import { getLoggedInUserAsync } from '../../redux/userSlice';


const PrivateRoute = ({ component: Component, ...rest }) => {
 // const auth = useSelector((state) => state.auth);
 const dispatch = useDispatch();
const {authToken} = useSelector(state => state.auth);
 useEffect(() => {
    
  if(authToken !== null){
     // dispatch(setAuthToken({authToken}))
      dispatch(getLoggedInUserAsync()).then((data) => {
          //console.log(localStorage.getItem("x-gogo-auth-token"));
          if(localStorage.getItem("x-gogo-auth-token") == null){
             dispatch(setAuthToken({authToken:null}))
          }else{
            dispatch(setAuthToken({authToken: localStorage.getItem("x-gogo-auth-token")}))
          }
          //console.log(data);
      })
  }
},[dispatch,authToken])

  return (
    <Route
      {...rest}
      render={(props) => 
        //!auth.authToken || !auth.isAuthenticated  ? (
         // let loginPath = '/login';
         /*  if(props.location.pathname){
            loginPath = `/login?r=${props.location.pathname}`;
          } */

          !localStorage.getItem('x-gogo-auth-token')  ? (
          <Redirect to={
            {
              pathname:'/login',
              /* search:(props.location.pathname)?`?r=${props.location.pathname.slice(1)}`:'', */
              state: { from: props.location}
            }
          }/>
        ) : (
          <Component {...props} />
        ) 
      }
    />
  );
};

export default PrivateRoute;
