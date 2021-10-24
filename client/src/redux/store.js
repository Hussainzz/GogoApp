import { configureStore } from "@reduxjs/toolkit";
import alertReducer from "./alertSlice";
import authReducer from "./authSlice";
import roomsReducer from "./roomSlice";
import userReducer from "./userSlice";
import notificationReducer from "./notificationSlice";

const store =  configureStore({
    reducer: {
      auth: authReducer,
      alert: alertReducer,
      currentUser: userReducer,
      rooms: roomsReducer,
      notifications: notificationReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
export default store;

/* function selectRoomData(state) {
  return state.rooms.roomData;
}

let currentValue;
export const triggerRoomDataChanges = () => {
  let previousValue = currentValue;
  currentValue = selectRoomData(store.getState());

  console.log('triggerRoomDataChanges');
  console.log(currentValue);
  console.log(previousValue);
  console.log(store.getState());
  if (currentValue !== null) {
      if(currentValue.joinedUsers.length) {
          return store.getState().rooms.roomData;
      }
  }
  return false;
}
store.subscribe(triggerRoomDataChanges); */

