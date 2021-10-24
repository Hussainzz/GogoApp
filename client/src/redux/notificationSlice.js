import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axiosAuthInstance from '../helpers/axiosAuthInstance';

export const getNotificationsAsync = createAsyncThunk('/notification/getNotificationAsync', async () => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const notifications = await axiosAuthInstance().get('/api/notifications',{},config);
        return notifications.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const markNotificationAsReadAsync = createAsyncThunk('/notification/markNotificationAsReadAsync', async (payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const markRead = await axiosAuthInstance().put('/api/notifications/mark-read',payload,config);
        return markRead.data
        
    } catch (e) {
        return e.response.data;
    }
});


const notificationSlice = createSlice({
    name: 'notification',
    initialState:{
        fetchNotification:false,
        notificationData:null,
        notificationCount:0,
        errors:[],
        loading:false
    },
    reducers:{
        resetNotificationErrors:(state, action) => {
            return {
              ...state,
              errors:[]
            }
        },
        addNewNotificationData:(state, action) => {
            return{
                ...state,
                notificationCount: state.notificationCount+1,
                notificationData:[
                    ...state.notificationData,action.payload
                ]
            }
        },
        markAsRead:(state, action) => {
            const unReadNotifications = state.notificationData.filter(notification => notification._id !== action.payload)
            return{
                ...state,
                notificationCount: state.notificationCount-1,
                notificationData:unReadNotifications
            }
        }
    },
    extraReducers:{
        [getNotificationsAsync.pending]:(state, action) => {
            return {
                ...state,
                fetchNotification: true
            }
        },
        [getNotificationsAsync.fulfilled]:(state, action) => {
            if(action.payload.status === 'success'){
                return {
                    ...state,
                    fetchNotification: false,
                    errors:[],
                    notificationData: action.payload.data,
                    notificationCount:action.payload.count
                }
            }else{
                return {
                    ...state,
                    fetchNotification: false,
                    errors:[],
                    notificationData: null,
                    notificationCount:0
                }
            }
        },
        [getNotificationsAsync.rejected]:(state, action) => {
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },

        [markNotificationAsReadAsync.pending]:(state, action) => {
            return {
                ...state,
                loading: true
            }
        },
        [markNotificationAsReadAsync.fulfilled]:(state, action) => {
            if(action.payload.status === 'success'){
                return {
                    ...state,
                    loading: false,
                    errors:[]
                }
            }else{
                return {
                    ...state,
                    loading: false,
                    errors:[...state.errors, action.payload.message]
                }
            }
        },
        [markNotificationAsReadAsync.rejected]:(state, action) => {
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },
    }
});

export const {
    resetNotificationErrors,
    addNewNotificationData,
    markAsRead
} = notificationSlice.actions;

export default notificationSlice.reducer;