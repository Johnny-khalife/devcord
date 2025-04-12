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
  isReacting: false,
  isPinningMessage: false,
  pinnedMessages: [],
  
  getMessages: async (channelId) => {
    set({ isMessagesLoading: true });
    try {
      console.log("message data is :", get().messages);
      const res = await axiosInstance.get(`/messages/${channelId}`);
      const messagesData = res.data.data.messages || [];
      
      // Process the messages to include isPinned information
      const processedMessages = messagesData.map(message => {
        return {
          ...message,
          // Keep track of whether this message is pinned by the system/admin
          isPinnedByCurrentUser: message.isPinned || false
        };
      });
      
      // Get messages that are pinned by admins
      const pinnedMessages = processedMessages.filter(message => message.isPinned);
      
      set({ 
        messages: processedMessages,
        pinnedMessages
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
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
  
  reactToMessage: async (messageId, emoji, channelId, userId) => {
    set({ isReacting: true });
    try {
      await axiosInstance.post(`/messages/${messageId}/react`, { emoji });
      
      // Optimistic update - add/toggle user's reaction
      const { messages } = get();
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      const updatedMessages = messages.map(message => {
        if (message._id === messageId) {
          // Clone the message to avoid direct state mutation
          const updatedMessage = { ...message };
          
          // Initialize reactions array if it doesn't exist
          if (!updatedMessage.reactions) {
            updatedMessage.reactions = [];
          }
          
          // Find if this emoji reaction already exists
          const existingReactionIndex = updatedMessage.reactions.findIndex(
            reaction => reaction.emoji === emoji
          );
          
          if (existingReactionIndex !== -1) {
            // Check if user already reacted with this emoji
            const reaction = { ...updatedMessage.reactions[existingReactionIndex] };
            
            // Initialize users array if it doesn't exist
            if (!reaction.users) {
              reaction.users = [];
            }
            
            const userReactedIndex = reaction.users.findIndex(
              id => id === userId || id._id === userId
            );
            
            if (userReactedIndex !== -1) {
              // User already reacted, remove their reaction
              const updatedUsers = [...reaction.users];
              updatedUsers.splice(userReactedIndex, 1);
              reaction.users = updatedUsers;
              
              // If no users left for this reaction, remove it
              if (reaction.users.length === 0) {
                const updatedReactions = [...updatedMessage.reactions];
                updatedReactions.splice(existingReactionIndex, 1);
                updatedMessage.reactions = updatedReactions;
              } else {
                // Otherwise update the reaction with new users list
                const updatedReactions = [...updatedMessage.reactions];
                updatedReactions[existingReactionIndex] = reaction;
                updatedMessage.reactions = updatedReactions;
              }
            } else {
              // Add user to existing reaction
              const updatedReactions = [...updatedMessage.reactions];
              updatedReactions[existingReactionIndex] = {
                ...reaction,
                users: [...reaction.users, userId]
              };
              updatedMessage.reactions = updatedReactions;
            }
          } else {
            // Create new reaction
            updatedMessage.reactions = [
              ...updatedMessage.reactions,
              {
                emoji,
                users: [userId]
              }
            ];
          }
          
          return updatedMessage;
        }
        return message;
      });
      
      set({ messages: updatedMessages });
      
      // If optimistic update failed or we prefer server data:
      // await get().getMessages(channelId);
      
    } catch (error) {
      console.error("Error reacting to message:", error);
      toast.error(error.response?.data?.message || "Failed to add reaction");
      
      // Refresh messages from server if optimistic update failed
      if (channelId) {
        await get().getMessages(channelId);
      }
    } finally {
      set({ isReacting: false });
    }
  },
  
  pinMessage: async (messageId, channelId) => {
    set({ isPinningMessage: true });
    try {
      const response = await axiosInstance.patch(`/messages/${messageId}/pin`);
      const { isPinned } = response.data.data;
      
      // Optimistic update for global pin status
      const { messages } = get();
      const updatedMessages = messages.map(message => 
        message._id === messageId 
          ? { ...message, isPinned, isPinnedByCurrentUser: isPinned } 
          : message
      );
      
      // Update all messages
      set({ messages: updatedMessages });
      
      // Update pinnedMessages based on isPinned flag
      const pinnedMessages = updatedMessages.filter(message => message.isPinned);
      set({ pinnedMessages });
      
      if (isPinned) {
        toast.success("Message pinned successfully");
      } else {
        toast.success("Message unpinned successfully");
      }
      
    } catch (error) {
      console.error("Error pinning message:", error);
      toast.error(error.response?.data?.message || "Failed to pin message");
      
      // Refresh messages on error
      if (channelId) {
        await get().getMessages(channelId);
      }
    } finally {
      set({ isPinningMessage: false });
    }
  },
  
  setSelectedFriend: (selectedFriend) => set({ selectedFriend }),
    
  
}));