import axios from "axios";
/* import { refreshTokenAsync } from "../redux/authSlice";
import store from "../redux/store"; */

const handleTokenRefresh = () => {
  return new Promise((resolve, reject) => {
      //${process.env.REACT_APP_API_URL}
      axios.post(`/api/auth/refresh-token`, { })
          .then(({data}) => {
              resolve(data);
          })
          .catch((err) => {
              reject(err);
          })
  });
};

const axiosAuthInstance = (history = null) => {
   // const baseURL = process.env.REACT_APP_API_URL;
  
    //const {dispatch} = store; 

    const axiosInstance = axios.create(/* {
      baseURL: baseURL,
    } */);
    
  // Add a request interceptor
  axiosInstance.interceptors.request.use(
    function(config) {
      const token = localStorage.getItem('x-gogo-auth-token');
      if (token) {
        config.headers['x-gogo-auth-token'] = token;/* `Bearer ${token}`; */
      }
      return config;
    },
    function(error) {
      return Promise.reject(error);
    }
  );

  // Add a response interceptor
  axiosInstance.interceptors.response.use(
    function(response) {
      //console.log(response);

      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response;
    },
    async function(error) {
      //console.log(error);
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      const originalRequest = error.config;
      
      if (error.response.status === 401 && originalRequest.url.includes("/api/auth/refresh-token") ) {
        localStorage.removeItem('x-gogo-auth-token');
        if (history) {
            history.push("/login");
        } else {
            window.location = "/login";
        }

        
        return Promise.reject(error);
      } else if(error.response.status === 401 && originalRequest.url.includes("/api/auth/revoke-token")){
        localStorage.removeItem('x-gogo-auth-token');
        if (history) {
            history.push("/login");
        } else {
            window.location = "/login";
        }
      }else if (error.response.status === 401 && !originalRequest._retry) {
        //console.log(originalRequest.url);
        localStorage.removeItem('x-gogo-auth-token')
        //console.log('refresh Block')
        originalRequest._retry = true;
                
         handleTokenRefresh().then((refreshToken) => {
            //console.log(refreshToken);
            if(refreshToken.status === 'success'){
              localStorage.setItem('x-gogo-auth-token', refreshToken['auth-token'])
              if (history) {
                history.push(window.location.href);
              } else {
                  window.location = window.location.href;
              }
            }
         }).catch((e) => {
            if (history) {
              history.push("/login");
            } else {
                window.location = "/login";
            }
         });

        return axios(originalRequest);
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
}

export default  axiosAuthInstance;