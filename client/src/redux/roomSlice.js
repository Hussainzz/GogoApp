import {createSlice, createAsyncThunk,current} from '@reduxjs/toolkit';
import { checkRooJoin } from '../helpers/api';

import axiosAuthInstance from '../helpers/axiosAuthInstance';

export const getUserRoomsAsync = createAsyncThunk('room/getUserRoomsAsync', async() => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const rooms = await axiosAuthInstance().get('/api/rooms/me',{},config);
        return rooms.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const getUserEnrolledRoomsAsync = createAsyncThunk('room/getUserEnrolledRoomsAsync', async() => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const rooms = await axiosAuthInstance().get('/api/rooms/enrolled-rooms',{},config);
        return rooms.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const getUserRoomInvitationsAsync = createAsyncThunk('room/getUserRoomInvitationsAsync', async() => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const rooms = await axiosAuthInstance().get('/api/rooms/invitations/me',{},config);
        return rooms.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const createRoomAsync = createAsyncThunk('room/createRoomAsync', async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const room = await axiosAuthInstance().post('/api/rooms/room',payload,config);
        return room.data
        
    } catch (e) {
        return e.response.data;
    }
});


export const getRoomDiscussionMessagesAsync = createAsyncThunk('room/getRoomDiscussionMessagesAsync', async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const rooms = await axiosAuthInstance().get(`/api/rooms/discussion/${payload.r}?page=${payload.p}`,{},config);
        return rooms.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const checkCanJoinRoomAsync = createAsyncThunk('/room/checkCanJoinRoomAsync', async(payload) =>{
    return await checkRooJoin(payload);
});


export const createAnnouncementAsync = createAsyncThunk('room/createAnnouncementAsync', async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const room = await axiosAuthInstance().post('/api/rooms/announcement',payload,config);
        return room.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const getRoomAnnouncementsAsync = createAsyncThunk('room/getRoomAnnouncementsAsync', async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const rooms = await axiosAuthInstance().get(`/api/rooms/announcements/${payload.r}?page=${payload.p}`,{},config);
        return rooms.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const createAnnouncementCommentAsync = createAsyncThunk('room/createAnnouncementCommentAsync', async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const comment = await axiosAuthInstance().post('/api/rooms/comment',payload,config);
        return comment.data
        
    } catch (e) {
        return e.response.data;
    }
});

export const deleteRoomAsync = createAsyncThunk('room/deleteRoomAsync', async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const rooms = await axiosAuthInstance().delete(`/api/rooms/room/${payload}`,{},config);
        return rooms.data
    } catch (e) {
        return e.response.data;
    }
})

const roomInitState = {
    userRooms:null,
    loading: false,
    fetchingRooms:false,
    errors:null,
    roomData:null,
    discussionData:null,
    hasMoreDiscussionMessages:false,
    loadingMoreMessages:false,
    roomReady:false,
    canJoinRoom:false,
    canJoinRoomLoading:false,
    userRoomInvitations:null,
    fetchingRoomInvitations:false,
    enrolledRooms:null,
    fetchingEnrolledRooms:false,
    roomAnnouncements:[],
    newAnnouncementMsg:'',
    firstAnnouncementLoad:false,
    fetchingAnnouncements:false,
    hasMoreAnnouncements:false,
};
const roomSlice = createSlice({
    name:'room',
    initialState:roomInitState,
    reducers:{
        resetNewAnnouncementMsg:(state, action) => {
            return {
              ...state,
              newAnnouncementMsg:''
            }
        },
        resetRoomErrors:(state, action) => {
            return {
              ...state,
              errors:[]
            }
        },
        getRoomData:(state, action) => {
            return {
                ...state,
                roomData: JSON.parse(action.payload),
                roomReady: true
            }
        },
        addPeersToRoomData:(state, action) => {
            const currentRoomData = JSON.parse(JSON.stringify(current(state).roomData));
            
            currentRoomData['peers']= action.payload;
            console.log('addPeersToRoomData');

            console.log(currentRoomData);
            console.log(action.payload);
            return{
                ...state,
                roomData:currentRoomData
            }
        },
        addPeerToRoomData:(state, action) => {
            const currentRoomData = JSON.parse(JSON.stringify(current(state).roomData));
            if(currentRoomData.peers && currentRoomData.peers.length){
                console.log('user');

                currentRoomData['peers'] = [...currentRoomData.peers,action.payload];
            }else{
                console.log('userz');

                currentRoomData['peers'] = [action.payload];
            }
            console.log('addPeerToRoomData');
            console.log(currentRoomData);
            console.log(action.payload);
            return{
                ...state,
                roomData:currentRoomData,
            }
        },
        updateDiscussionMessages:(state, action) =>{
            return{
                ...state,
                discussionData:[
                    ...state.discussionData,
                    action.payload
                ]
            }
        },
        resetRoomState:(state, action) =>{
            return {
                ...state,
                loading: false,
                fetchingRooms:false,
                errors:null,
                roomData:null,
                discussionData:null,
                roomReady:false,
                canJoinRoom:false,
                canJoinRoomLoading:false,
                fetchingEnrolledRooms:false,
                roomAnnouncements:[]
            }
        },
        resetLoadingMoreMessages:(state, action) =>{
            return {
                ...state,
                loadingMoreMessages:false
            }
        },
        resetCanJoinRoom:(state, action) => {
            return {
                ...state,
                canJoinRoom:false,
                canJoinRoomLoading:false
            }
        },
        resetFetchingAnnouncements:(state, action) =>{
            return {
                ...state,
                fetchingAnnouncements:false
            }
        },
        addNewAnnouncements:(state, action) =>{
            return{
                ...state,
                roomAnnouncements:[action.payload, ...state.roomAnnouncements]
            }
        },
        addNewAnnouncementComment:(state, action) =>{
            const newComment = action.payload;
            let allAnnouncements = JSON.parse(JSON.stringify(current(state).roomAnnouncements));
            const elementsIndex = allAnnouncements.findIndex(element => element._id === newComment.announcement )
            allAnnouncements[elementsIndex]['comments'].push(newComment);
            return {
                ...state,
                loading: false,
                errors:[],
                roomAnnouncements: allAnnouncements
            }
        },
        removeUserCreatedRoom:(state, action) =>{
            const allUserRooms = JSON.parse(JSON.stringify(current(state).userRooms));
            const filteredRooms = allUserRooms.filter(r => r.roomToken !== action.payload);
            return {
                ...state,
                userRooms: filteredRooms   
            }
        }
        
    },
    extraReducers:{
        [getUserRoomsAsync.pending] :(state,action) =>{
            return {
                ...state,
                fetchingRooms: true
            }
        },
        [getUserRoomsAsync.fulfilled] :(state,action) =>{
                if(action.payload.status === 'success'){
                    return {
                        ...state,
                        fetchingRooms: false,
                        errors:[],
                        userRooms: action.payload.data
                    }
                }else{
                    return {
                        ...state,
                        fetchingRooms: false,
                        errors:[],
                        userRooms: null
                    }
                }
        },
        [getUserRoomsAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },

        [createRoomAsync.pending] :(state,action) =>{
            return {
                ...state,
                loading: true
            }
        },
        [createRoomAsync.fulfilled] :(state,action) =>{
            if(action.payload.status === 'success'){
                return {
                    ...state,
                    loading: false,
                    errors:[],
                    userRooms: [...state.userRooms, action.payload.data]
                }
            }else{
                return {
                    ...state,
                    loading: false,
                    errors:[...state.errors, action.payload.message]
                }
            }
        },
        [createRoomAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },


        [getRoomDiscussionMessagesAsync.pending] :(state,action) =>{
            return {
                ...state,
                loadingMoreMessages:true
            }
        },
        [getRoomDiscussionMessagesAsync.fulfilled] :(state,action) =>{
                if(action.payload.status === 'success'){
                    if(state.discussionData){
                        return {
                            ...state,
                            discussionData:[...action.payload.data, ...state.discussionData ],
                            hasMoreDiscussionMessages: action.payload.hasMoreMessages,
                            loadingMoreMessages:false
                        }
                    }else{
                        return {
                            ...state,
                            discussionData:action.payload.data,
                            hasMoreDiscussionMessages: action.payload.hasMoreMessages,
                            loadingMoreMessages:false
                        }
                    }
                    
                }else{
                    return {
                        ...state
                    }
                }
        },
        [getRoomDiscussionMessagesAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },

        [checkCanJoinRoomAsync.pending]: (state, action) => {
            return {
                ...state,
                canJoinRoomLoading:true
            }
        },
        [checkCanJoinRoomAsync.fulfilled]:(state, action)=>{
            if(action.payload.status === 'success'){
                return {
                    ...state,
                    canJoinRoom: action.payload.canJoin,
                    canJoinRoomLoading:false
                }
            }else{
                return {
                    ...state,
                    canJoinRoom:false,
                    canJoinRoomLoading:false,
                    errors: ['Please check your room token']
                }
            }
        },
        [checkCanJoinRoomAsync.rejected]: (state, action) => {
            return {
                ...state,
                canJoinRoom:false,
                canJoinRoomLoading:false,
                errors: ['Please check your room token']
            }
        },

        [getUserRoomInvitationsAsync.pending] :(state,action) =>{
            return {
                ...state,
                fetchingRoomInvitations: true
            }
        },
        [getUserRoomInvitationsAsync.fulfilled] :(state,action) =>{
                if(action.payload.status === 'success'){
                    return {
                        ...state,
                        fetchingRoomInvitations: false,
                        errors:[],
                        userRoomInvitations: action.payload.data
                    }
                }else{
                    return {
                        ...state,
                        fetchingRoomInvitations: false,
                        errors:[],
                        userRoomInvitations: null
                    }
                }
        },
        [getUserRoomInvitationsAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },

        [getUserEnrolledRoomsAsync.pending] :(state,action) =>{
            return {
                ...state,
                fetchingEnrolledRooms: true
            }
        },
        [getUserEnrolledRoomsAsync.fulfilled] :(state,action) =>{
                if(action.payload.status === 'success'){
                    return {
                        ...state,
                        fetchingEnrolledRooms: false,
                        errors:[],
                        enrolledRooms: action.payload.data
                    }
                }else{
                    return {
                        ...state,
                        fetchingEnrolledRooms: false,
                        errors:[],
                        enrolledRooms: null
                    }
                }
        },
        [getUserEnrolledRoomsAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },

        [createAnnouncementAsync.pending] :(state,action) =>{
            return {
                ...state,
                loading: true
            }
        },
        [createAnnouncementAsync.fulfilled] :(state,action) =>{
            if(action.payload.status === 'success'){
                return {
                    ...state,
                    loading: false,
                    errors:[],
                    newAnnouncementMsg: action.payload.message,
                    //roomAnnouncements: (action.payload.data.length)?[action.payload.data[0],...state.roomAnnouncements]:[...state.roomAnnouncements]
                }
            }else{
                return {
                    ...state,
                    loading: false,
                    errors:[...state.errors, action.payload.message]
                }
            }
        },
        [createAnnouncementAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },

        [getRoomAnnouncementsAsync.pending] :(state,action) =>{
            return {
                ...state,
                fetchingAnnouncements: true
            }
        },
        [getRoomAnnouncementsAsync.fulfilled] :(state,action) =>{
            if(action.payload.status === 'success'){
                return {
                    ...state,
                    fetchingAnnouncements: false,
                    firstAnnouncementLoad:true,
                    errors:[],
                    roomAnnouncements:[ ...state.roomAnnouncements, ...action.payload.data ],
                    hasMoreAnnouncements: action.payload.hasMoreMessages
                }
            }else{
                return {
                    ...state,
                    fetchingAnnouncements: false,
                    firstAnnouncementLoad:true,
                    errors:[],
                    roomAnnouncements: null
                }
            }
        },
        [getRoomAnnouncementsAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },


        [createAnnouncementCommentAsync.pending] :(state,action) =>{
            return {
                ...state,
                loading: true
            }
        },
        [createAnnouncementCommentAsync.fulfilled] :(state,action) =>{
            if(action.payload.status === 'success'){
               /*  const newComment = action.payload.data;
                let allAnnouncements = JSON.parse(JSON.stringify(current(state).roomAnnouncements));
                const elementsIndex = allAnnouncements.findIndex(element => element._id === newComment.announcement )
                allAnnouncements[elementsIndex]['comments'].push(newComment); */
                return {
                    ...state,
                    loading: false,
                    errors:[]/* ,
                    roomAnnouncements: allAnnouncements */
                }
            }else{
                return {
                    ...state,
                    loading: false,
                    errors:[...state.errors, action.payload.message]
                }
            }
        },
        [createAnnouncementCommentAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        },

        [deleteRoomAsync.pending] :(state,action) =>{
            return {
                ...state,
                loading: true
            }
        },
        [deleteRoomAsync.fulfilled]:(state, action) =>{
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
        [deleteRoomAsync.rejected] :(state,action) =>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        }
    }   
})

export const { resetRoomErrors,getRoomData,addPeersToRoomData,addPeerToRoomData,updateDiscussionMessages,resetRoomState,resetLoadingMoreMessages,resetCanJoinRoom,resetNewAnnouncementMsg,resetFetchingAnnouncements,addNewAnnouncements,addNewAnnouncementComment,removeUserCreatedRoom } = roomSlice.actions;


export default roomSlice.reducer