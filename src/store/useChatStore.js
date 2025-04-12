import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedFriend: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isDeletingMessage: false,
  
  getMessages: async (channelId) => {
        set({ isMessagesLoading: true });
        const {  messages } = get();
        try {
          console.log("message data is :",messages)
          const res = await axiosInstance.get(`/messages/${channelId}`);
          set({ messages: res.data.data.messages ||[] });
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

      sendMessage: async (messageData,channelId) => {
        // const {  messages } = get();
  
        console.log(" id of crrent message is :",messageData)
        try {
          const response = await axiosInstance.post(`/messages/${channelId}`, messageData);
          const newMessage = response.data.data;
    
          // Fetch all messages again to ensure consistent data structure
          await get().getMessages(channelId);
          
          return newMessage;

        } catch (error) {
          console.log(error.message)
          toast.error(error.response?.data.message);
        }
      },

      deleteMessage: async (messageId, channelId) => {
        set({ isDeletingMessage: true });
        try {
          await axiosInstance.delete(`/messages/${messageId}`);
          
          // Option 1: Optimistic update (faster UI response)
          set((state) => ({
            messages: state.messages.filter((message) => message._id !== messageId)
          }));
          
          // If we need to refetch instead of optimistic updates:
          if (channelId) {
            // Uncomment to use refetch approach instead of optimistic updates
            // await get().getMessages(channelId);
          }
          
          toast.success("Message deleted successfully");
        } catch (error) {
          console.error("Error deleting message:", error);
          toast.error(error.response?.data?.message || "Failed to delete messageeeeeeeee");
        } finally {
          set({ isDeletingMessage: false });
        }
      },
      
      setSelectedFriend: (selectedFriend) => set({ selectedFriend }),
        
      
    }));