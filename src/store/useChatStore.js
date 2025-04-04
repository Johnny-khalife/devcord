import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedFriend: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  
  getMessages: async (channelId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${channelId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // getMessages: async (friendId, channelId) => {
  //   set({ isMessagesLoading: true });
  //   try {
  //     let endpoint;
      
  //     // Determine which type of messages to fetch
  //     if (friendId) {
  //       endpoint = `/messages/user/${friendId}`;
  //     } else if (channelId) {
  //       endpoint = `/messages/channel/${channelId}`;
  //     } else {
  //       throw new Error("Either friendId or channelId must be provided");
  //     }
      
  //     const res = await axiosInstance.get(endpoint);
  //     set({ messages: res.data });
  //   } catch (error) {
  //     toast.error(error?.response?.data?.message || "Failed to load messages");
  //   } finally {
  //     set({ isMessagesLoading: false });
  //   }
  // },

  sendMessage: async (messageData, channelId) => {
    try {
      const response = await axiosInstance.post(`/messages/${channelId}`, messageData);
      // Ensure we have an array by using Array.isArray check
      const currentMessages = Array.isArray(get().messages) ? get().messages : [];
      set({ messages: [...currentMessages, response.data] });
      console.log("mesasges array",get().messages);
      
    } catch (error) {
      console.log(error.message);
      toast.error(error.response?.data.message);
    }
  },

  setSelectedFriend: (selectedFriend) => set({ selectedFriend }),
  
  

}));