import {createSlice, createAsyncThunk} from '@reduxjs/toolkit'
import axiosAuthInstance from '../helpers/axiosAuthInstance'


export const getLoggedInUserAsync = createAsyncThunk('user/getLoggedInUserAsync', async (payload) => {
    try{
        const config = {
            "Content-Type": "application/json",
          };
        const user = await axiosAuthInstance().get('/api/users/me',{'x-gogo-auth-token':payload},config)
        return user.data;
    }catch(e){
        return e.response.data
    }
})

const userSlice = createSlice({
    name:'user',
    initialState:{
        currentUserId:null,
        name:null,
        email:null,
        loading:false,
        errors:[]
    },
    extraReducers:{
        [getLoggedInUserAsync.pending] :(state,action)=>{
            return {
                ...state,
                loading:true
            }
        },
        [getLoggedInUserAsync.fulfilled] :(state,action)=>{
            if(action.payload.status === 'success'){
                let {_id, name, email} = action.payload.data;
                return {
                    ...state,
                    currentUserId:_id,
                    name:name,
                    email:email,
                    loading:false,
                    errors:[]
                }
            }else{
                return {
                    ...state,
                    loading:false,
                    errors:[...state.errors, action.payload.message]
                }
            }
        },
        [getLoggedInUserAsync.rejected] :(state,action)=>{
            return {
                ...state,
                errors:[...state.errors, action.payload.message]
            }
        }
    }
})

export default userSlice.reducer;