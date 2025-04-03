import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedFriend: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
          const res = await axiosInstance.get(`/messages/${userId}`);
          set({ messages: res.data });
        } catch (error) {
          toast.error(error.response.data.message);
        } finally {
          set({ isMessagesLoading: false });
        }
      },
      sendMessage: async (messageData) => {
        const { selectedFriend, messages } = get();
        try {
          const res = await axiosInstance.post(`/messages/send/${selectedFriend._id}`, messageData);
          set({ messages: [...messages, res.data] });
        } catch (error) {
          toast.error(error.response.data.message);
        }
      },
      setSelectedFriend: (selectedFriend) => set({ selectedFriend }),
        
      

    }));