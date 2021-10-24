import axiosAuthInstance from '../helpers/axiosAuthInstance';
export const checkRooJoin = async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const roomJoin = await axiosAuthInstance().get(`/api/rooms/room/${payload}`,{},config);
        return roomJoin.data
    } catch (e) {
        return e.response.data;
    }
}

export const enrollToPrivateRoom = async(payload) => {
    try {
        const config = {
            "Content-Type": "application/json"
          };
        const enroll = await axiosAuthInstance().post(`/api/rooms/room/enroll`,payload,config);
        return enroll.data
    } catch (e) {
        return e.response.data;
    }
}