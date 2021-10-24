import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuid } from "uuid";
import axiosAuthInstance from "../helpers/axiosAuthInstance";
import axios from "axios";
axios.defaults.withCredentials = true;
export const loginAsync = createAsyncThunk(
  "auth/loginAsync",
  async (payload) => {
    try {
      const config = {
        "Content-Type": "application/json"/* ,
        withCredentials: true */
      };

      const login = await axiosAuthInstance().post(
        "/api/auth/login",
        payload,
        config
      );
      //console.log(login);
      return login.data;
    } catch (err) {
      console.log(err);

      return err.response.data;
    }
  }
);

export const validateResetTokenAsync = createAsyncThunk('auth/validateResetTokenAsync', async (payload) => {
  try {
    const config = {
      "Content-Type": "application/json"
    };
    const response = await axiosAuthInstance().post('/api/auth/validate-reset-token',payload,config);
    return response.data;
  } catch (err) {
      return err.response.data
  }
})

export const resetPasswordAsync = createAsyncThunk('auth/resetPasswordAsync', async (payload) => {
  try {
    const config = {
      "Content-Type": "application/json"
    };
    const response = await axiosAuthInstance().put('/api/auth/reset-password',payload,config);
    return response.data;
  } catch (err) {
      return err.response.data
  }
})

export const forgotPasswordAsync = createAsyncThunk('auth/forgotPasswordAsync', async (payload) => {
    try {
        const config = {
          "Content-Type": "application/json"
        };
        const response = await axiosAuthInstance().post('/api/auth/forgot-password',payload,config);
        return response.data;
    } catch (err) {
        return err.response.data
    }
});

/* http://localhost:7000/api */
export const registerAsync = createAsyncThunk(
  "auth/registerAsync",
  async (payload) => {
    try {
      const config = {
        "Content-Type": "application/json",
      };
      const register = await axiosAuthInstance().post( "/api/auth/register-user",
        payload,
        config
      );
      return register.data;
    } catch (err) {
      return err.response.data;
    }
  }
);

export const logoutAsync = createAsyncThunk('auth/logoutAsync', async () => {
  try {
      const config = {
        "Content-Type": "application/json"
      };
      const logout = await axiosAuthInstance().delete("/api/auth/revoke-token",{},config);
      return logout.data;
  } catch (err) {
      return err.response.data;
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authToken: localStorage.getItem("x-gogo-auth-token"),
    isAuthenticated: false,
    loading: false,
    successMessage: null,
    user: null,
    authErrors: [],
  },
  reducers: {
    setAuthToken:(state, action) => {
      return {
        ...state,
        authToken:action.payload.authToken,
        isAuthenticated: true
      }
    },
    resetAuthState: (state, action) => {
      return {
        authToken: localStorage.getItem("x-gogo-auth-token"),
        isAuthenticated: false,
        loading: false,
        successMessage: null,
        user: null,
        authErrors: [],
      };
    },
  },
  extraReducers: {
    [registerAsync.pending]: (state, action) => {
      return {
        ...state,
        loading: true,
        authErrors: [],
      };
    },
    [registerAsync.fulfilled]: (state, action) => {
      if (action.payload.status === "success") {
        return {
          ...state,
          loading: false,
          authErrors: [],
          successMessage:action.payload.message
        };
      } else {
        return {
          ...state,
          loading: false,
          authErrors: [
            ...state.authErrors,
            {
              id: uuid(),
              msg: action.payload.message,
              type: "danger",
            },
          ],
        };
      }
    },
    [registerAsync.rejected]: (state, action) => {
      return {
        ...state,
        authErrors: [
          ...state.authErrors,
          {
            id: uuid(),
            msg: action.payload.message,
            type: "danger",
          },
        ],
      };
    },

    [loginAsync.pending]: (state, action) => {
       // console.log("pending");
        //console.log(action);
        return {
            ...state,
            loading: true,
            isAuthenticated:false,
            authErrors: [],
          };
    },
    [loginAsync.fulfilled]: (state, action) => {
        const xAuthToken = action.payload['auth-token'];
        if(xAuthToken !== ''){
          localStorage.setItem("x-gogo-auth-token", xAuthToken)
          return {
            ...state,
            authToken:xAuthToken,
            isAuthenticated:true,
            loading:false
          }
        }else{
          return {
            ...state,
            loading:false,
            authErrors: [
              ...state.authErrors,
              {
                id: uuid(),
                msg: action.payload.message,
                type: "danger",
              },
            ],
          };
        }
    },
    [loginAsync.rejected]: (state, action) => {
      //console.log(action);
      return {
        ...state,
        authErrors: [
          ...state.authErrors,
          {
            id: uuid(),
            msg: action.payload.message,
            type: "danger",
          },
        ],
      };
    },

    [forgotPasswordAsync.pending] : (state, action) => {
      return {
        ...state,
        loading: true,
        authErrors: [],
      };
    },
    [forgotPasswordAsync.fulfilled] : (state, action) => {
        if(action.payload.status === 'success'){
          return {
            ...state,
            loading:false,
            successMessage:action.payload.message
          }
        }else{
          return {
            ...state,
            loading:false,
            authErrors: [
              ...state.authErrors,
              {
                id: uuid(),
                msg: action.payload.message,
                type: "danger",
              },
            ],
          };
        }
    },
    [forgotPasswordAsync.rejected] : (state, action) => {
     // console.log('rejected')
      return {
        ...state,
        authErrors: [
          ...state.authErrors,
          {
            id: uuid(),
            msg: action.payload.message,
            type: "danger",
          },
        ],
      };

    },
    
    [validateResetTokenAsync.pending] : (state, action) => {
      return {
        ...state,
        validatingToken: true,
        authErrors: [],
      };
    },
    [validateResetTokenAsync.fulfilled] : (state, action) => {
      if (action.payload.status === "success") {
        return {
          ...state,
          validatingToken: false,
          passwordTokenValid:true
        };
      } else {
        return {
          ...state,
          validatingToken: false,
          passwordTokenValid:false
        };
      }
    },
    [validateResetTokenAsync.rejected] : (state, action) => {
      return {
        ...state,
        validatingToken: false,
        passwordTokenValid:false
      };
    },

    [resetPasswordAsync.pending]: (state, action) => {
      return {
        ...state,
        loading: true,
        authErrors: [],
      };
    },
    [resetPasswordAsync.fulfilled]: (state, action) => {
      if (action.payload.status === "success") {
        return {
          ...state,
          loading: false,
          authErrors: [],
          successMessage:action.payload.message
        };
      } else {
        return {
          ...state,
          loading: false,
          authErrors: [
            ...state.authErrors,
            {
              id: uuid(),
              msg: action.payload.message,
              type: "danger",
            },
          ],
        };
      }
    },
    [resetPasswordAsync.rejected]: (state, action) => {
      return {
        ...state,
        authErrors: [
          ...state.authErrors,
          {
            id: uuid(),
            msg: action.payload.message,
            type: "danger",
          },
        ],
      };
    },

    [logoutAsync.pending]: (state, action) => {
      return {
        ...state,
        loading: true,
        authErrors: [],
      };
    },
    [logoutAsync.fulfilled]: (state, action) => {
      localStorage.removeItem("x-gogo-auth-token")
      return {
        authToken: null,
        isAuthenticated: false,
        loading: false,
        successMessage: null,
        user: null,
        authErrors: [],
      };
    },
    [logoutAsync.rejected]: (state, action) => {
     
      localStorage.removeItem("x-gogo-auth-token")
      return {
        authToken: null,
        isAuthenticated: false,
        loading: false,
        successMessage: null,
        user: null,
        authErrors: [],
      };
    }
  },
});

export const { resetAuthState, setAuthToken } = authSlice.actions;

export default authSlice.reducer;
