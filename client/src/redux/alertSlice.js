import {createSlice} from '@reduxjs/toolkit';
import {v4 as uuid} from "uuid"

const alertSlice = createSlice({
    name:'alert',
    initialState:[],
    reducers:{
        setAlertMessage(state, action){
            const msg = {
                id : uuid(),
                msg: action.payload.msg,
                type: action.payload.eType
            }
            return [
                ...state,
                msg
            ]
        },
        removeAlertMessage(state, action){
            return state.filter((alert) => alert.id !== action.payload.id);
        }
    },
})

export const {
    setAlertMessage,
    removeAlertMessage
}   = alertSlice.actions;

export default alertSlice.reducer;