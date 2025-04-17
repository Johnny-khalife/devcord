import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export const useChatStore = create((set, get) => ({
  messages: [],
  directMessages: [],
  users: [],
  selectedFriend: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isDeletingMessage: false,
  isReacting: false,
  isSearching: false,
  searchResults: [],
  searchQuery: "",
  searchPagination: null,
  typingIndicators: {}, // Track which users are typing
  
  getMessages: async (channelId) => {
    if (!channelId) return;
    
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${channelId}`);
      const messagesData = res.data.data.messages || [];
      
      // Process the messages
      const processedMessages = messagesData.map(message => {
        return {
          ...message
        };
      });
      
      set({ 
        messages: processedMessages,
        directMessages: []
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getDirectMessages: async (friendId) => {
    if (!friendId) return;
    
    set({ isMessagesLoading: true });
    try {
      // Update the route to match backend implementation
      const res = await axiosInstance.get(`/direct-messages/friend/${friendId}`);
      
      // Extract conversation data from the response
      const messagesData = res.data.data.conversation || [];
      
      // For each message, make sure it has sender information
      const processedMessages = messagesData.map(message => {
        // Structure the message for consistent UI rendering
        return {
          ...message,
          // Make sure sender information is available for display
         
        };
      });
      console.log("directMessages", get().directMessages);
      set({ 
        directMessages: processedMessages,
        messages: []
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load direct messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData, channelId) => {
    if (!channelId) {
      toast.error("Channel ID is required");
      return;
    }
    
    try {
      const response = await axiosInstance.post(`/messages/${channelId}`, messageData);
      const newMessage = response.data.data;

      // Fetch all messages again to ensure consistent data structure
      await get().getMessages(channelId);
      
      return newMessage;
    } catch (error) {
      console.log(error.message);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  sendDirectMessage: async (messageData, friendId) => {
    if (!friendId) {
      toast.error("Friend ID is required");
      return;
    }
    
    try {
      // Simplify to avoid language validation issues
      const requestData = {
        content: messageData.message,
        // Always set these values explicitly
        isCode: false,
        language: "text"
      };
      
      console.log("Sending direct message with data:", requestData);
      
      // Use the direct messages route
      const response = await axiosInstance.post(
        `/direct-messages/friend/${friendId}`, 
        requestData
      );
      
      const newMessage = response.data.data;

      // Fetch all messages again to ensure consistent data structure
      await get().getDirectMessages(friendId);
      
      return newMessage;
    } catch (error) {
      console.error("Error in sendDirectMessage:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to send direct message");
      }
    }
  },

  deleteMessage: async (messageId, channelId, isDirect = false) => {
    console.log("deleteMessage called with:", { messageId, channelId, isDirect });
    
    if (!messageId) {
      console.error("Missing messageId in deleteMessage");
      toast.error("Message ID is required");
      return;
    }
    
    set({ isDeletingMessage: true });
    try {
      let response;
      
      if (isDirect) {
        console.log(`Sending delete request for direct message ${messageId}`);
        response = await axiosInstance.delete(`/direct-messages/${messageId}`);
        
        set((state) => ({
          directMessages: state.directMessages.filter((message) => message._id !== messageId),
          // Also remove from search results to prevent "message not found" errors
          directMessageSearchResults: state.directMessageSearchResults ? 
            state.directMessageSearchResults.filter(
              (message) => (message._id !== messageId && message.messageId !== messageId)
            ) : []
        }));
      } else {
        if (!channelId) {
          console.error("Missing channelId in deleteMessage for channel message");
          toast.error("Channel ID is required to delete messages");
          return;
        }
        
        console.log(`Sending delete request for message ${messageId} in channel ${channelId}`);
        response = await axiosInstance.delete(`/messages/${messageId}`);
        
        set((state) => ({
          messages: state.messages.filter((message) => message._id !== messageId),
          // Also remove from search results to prevent "message not found" errors
          searchResults: state.searchResults ? 
            state.searchResults.filter(
              (message) => (message._id !== messageId && message.messageId !== messageId)
            ) : []
        }));
      }
      
      console.log("Delete response:", response.data);
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error deleting message:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to delete message");
      
      if (isDirect) {
        const { selectedFriend } = get();
        if (selectedFriend?.friendId) {
          await get().getDirectMessages(selectedFriend.friendId);
        }
      } else if (channelId) {
        await get().getMessages(channelId);
      }
    } finally {
      set({ isDeletingMessage: false });
    }
  },
  
  reactToMessage: async (messageId, emoji, channelId, userId) => {
    console.log("reactToMessage called with:", { messageId, emoji, channelId, userId });
    
    if (!messageId) {
      console.error("Missing messageId in reactToMessage");
      toast.error("Message ID is required");
      return;
    }
    
    if (!emoji) {
      console.error("Missing emoji in reactToMessage");
      toast.error("Emoji is required");
      return;
    }
    
    if (!channelId) {
      console.error("Missing channelId in reactToMessage");
      toast.error("Channel ID is required to add reactions");
      return;
    }
    
    if (!userId) {
      console.error("Missing userId in reactToMessage");
      toast.error("User not authenticated");
      return;
    }
    
    set({ isReacting: true });
    try {
      console.log(`Sending reaction request for message ${messageId} in channel ${channelId}`);
      const response = await axiosInstance.post(`/messages/${messageId}/react`, { emoji });
      console.log("Reaction response:", response.data);
      
      // Optimistic update - add/toggle user's reaction
      const { messages } = get();
      
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
      
    } catch (error) {
      console.error("Error reacting to message:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to add reaction");
      
      // Refresh messages from server if optimistic update failed
      if (channelId) {
        await get().getMessages(channelId);
      }
    } finally {
      set({ isReacting: false });
    }
  },
  
  searchMessages: async (channelId, query, page = 1, limit = 20) => {
    console.log("searchMessages called with:", { channelId, query, page, limit });
    
    if (!channelId) {
      console.error("Missing channelId in searchMessages");
      toast.error("Channel ID is required to search messages");
      return;
    }
    
    if (!query || query.trim() === "") {
      console.log("Empty query, clearing search results");
      set({ 
        searchResults: [],
        searchQuery: "",
        searchPagination: null
      });
      return;
    }
    
    set({ 
      isSearching: true,
      searchQuery: query
    });
    
    try {
      console.log(`Sending search request for query "${query}" in channel ${channelId}`);
      const response = await axiosInstance.get(`/messages/${channelId}/search`, {
        params: { query, page, limit }
      });
      console.log("Search response:", response.data);
      
      // Check if the response has the expected structure
      if (response.data && response.data.data) {
        const { messages, pagination } = response.data.data;
        
        // Filter out messages that don't exist in current messages list
        const { messages: currentMessages } = get();
        const availableMessages = messages?.filter(searchMsg => 
          currentMessages.some(currentMsg => 
            currentMsg._id === searchMsg._id || currentMsg._id === searchMsg.messageId
          )
        ) || [];
        
        console.log(`Found ${availableMessages.length} valid search results out of ${messages?.length || 0}`);
        set({ 
          searchResults: availableMessages,
          searchPagination: pagination ? {
            ...pagination,
            total: availableMessages.length
          } : null
        });
      } else {
        console.error("Unexpected search response format:", response.data);
        set({ 
          searchResults: [],
          searchPagination: null
        });
        toast.error("Invalid search response from server");
      }
    } catch (error) {
      console.error("Error searching messages:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to search messages");
      
      set({ 
        searchResults: [],
        searchPagination: null
      });
    } finally {
      set({ isSearching: false });
    }
  },
  
  // Add function to search direct messages
  searchDirectMessages: async (friendId, query, page = 1, limit = 20) => {
    console.log("searchDirectMessages called with:", { friendId, query, page, limit });
    
    if (!friendId) {
      console.error("Missing friendId in searchDirectMessages");
      toast.error("Friend ID is required to search direct messages");
      return;
    }
    
    if (!query || query.trim() === "") {
      console.log("Empty query, clearing direct message search results");
      set({ 
        directMessageSearchResults: [],
        directMessageSearchQuery: "",
        directMessageSearchPagination: null
      });
      return;
    }
    
    set({ 
      isSearching: true,
      directMessageSearchQuery: query
    });
    
    try {
      console.log(`Sending direct message search request for query "${query}" with friend ${friendId}`);
      const response = await axiosInstance.get(`/direct-messages/search/${friendId}`, {
        params: { query, page, limit }
      });
      console.log("Direct message search response:", response.data);
      
      // Check if the response has the expected structure
      if (response.data && response.data.data) {
        const { messages, pagination } = response.data.data;
        
        // Filter out messages that don't exist in current direct messages list
        const { directMessages } = get();
        const availableMessages = messages?.filter(searchMsg => 
          directMessages.some(currentMsg => 
            currentMsg._id === searchMsg._id || currentMsg._id === searchMsg.messageId
          )
        ) || [];
        
        console.log(`Found ${availableMessages.length} valid direct message search results out of ${messages?.length || 0}`);
        set({ 
          directMessageSearchResults: availableMessages,
          directMessageSearchPagination: pagination ? {
            ...pagination,
            total: availableMessages.length
          } : null
        });
      } else {
        console.error("Unexpected direct message search response format:", response.data);
        set({ 
          directMessageSearchResults: [],
          directMessageSearchPagination: null
        });
        toast.error("Invalid search response from server");
      }
    } catch (error) {
      console.error("Error searching direct messages:", error);
      console.error("Error details:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to search direct messages");
      
      set({ 
        directMessageSearchResults: [],
        directMessageSearchPagination: null
      });
    } finally {
      set({ isSearching: false });
    }
  },
  
  clearSearch: () => {
    set({ 
      searchResults: [],
      searchQuery: "",
      searchPagination: null,
      directMessageSearchResults: [],
      directMessageSearchQuery: "",
      directMessageSearchPagination: null
    });
  },
  
  setSelectedFriend: (friend) => {
    set({ selectedFriend: friend });
  },
  
  // Add a direct message from socket or API
  addDirectMessage: (messageData) => {
    console.log("Adding direct message to store:", messageData);
    
    if (!messageData) {
      console.error("Invalid message data received");
      return;
    }
    
    // Get the current direct messages and auth info
    const { directMessages, selectedFriend } = get();
    const authUser = window.authUser || JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser;
    
    if (!authUser) {
      console.error("Cannot add message: No authenticated user found");
      return;
    }
    
    // Get the sender ID from the message
    const senderId = messageData.sender?.userId || messageData.senderId;
    const isFromCurrentUser = senderId === authUser._id;
    
    console.log("Message sender check:", { 
      senderId, 
      currentUserId: authUser._id, 
      isFromCurrentUser,
      selectedFriendId: selectedFriend?.friendId
    });
    
    // Only add messages that are related to the current chat
    const isRelevantToCurrentChat = selectedFriend && (
      senderId === selectedFriend.friendId || // Message from selected friend
      (isFromCurrentUser && messageData.receiverId === selectedFriend.friendId) // Message from current user to selected friend
    );
    
    if (!isRelevantToCurrentChat && selectedFriend) {
      console.log("Message not relevant to current chat, skipping");
      return;
    }
    
    // Create a standardized message object
    const newMessage = {
      _id: messageData._id || messageData.id || `temp-${Date.now()}`,
      content: messageData.message || messageData.content,
      sender: isFromCurrentUser ? {
        userId: authUser._id,
        username: authUser.username,
        avatar: authUser.avatar
      } : messageData.sender,
      senderId: senderId,
      receiverId: isFromCurrentUser ? messageData.receiverId || selectedFriend?.friendId : authUser._id,
      createdAt: messageData.timestamp || messageData.createdAt || new Date().toISOString(),
      updatedAt: messageData.updatedAt || new Date().toISOString(),
      isCode: messageData.isCode || false,
      language: messageData.language || "text",
      isSentByMe: isFromCurrentUser
    };
    
    // Check if the message already exists in the chat store
    const messageExists = directMessages.some(msg => 
      (msg._id && msg._id === newMessage._id) || 
      (msg.content === newMessage.content && 
       msg.senderId === newMessage.senderId && 
       Math.abs(new Date(msg.createdAt) - new Date(newMessage.createdAt)) < 1000)
    );
    
    if (messageExists) {
      console.log("Message already exists in store, skipping", newMessage);
      return;
    }
    
    console.log("Adding new message to direct messages:", newMessage);
    
    // Add the message to the store
    set({
      directMessages: [...directMessages, newMessage]
    });
  },
  
  // Method to handle typing indicators
  setTypingIndicator: (data) => {
    const { senderId, isTyping } = data;
    
    set((state) => ({
      typingIndicators: {
        ...state.typingIndicators,
        [senderId]: isTyping ? Date.now() : null
      }
    }));
    
    // Clear typing indicator after a delay
    if (isTyping) {
      setTimeout(() => {
        set((state) => {
          const typingTime = state.typingIndicators[senderId];
          // Only clear if it hasn't been updated in the last 3 seconds
          if (typingTime && Date.now() - typingTime > 3000) {
            return {
              typingIndicators: {
                ...state.typingIndicators,
                [senderId]: null
              }
            };
          }
          return state;
        });
      }, 3500);
    }
  },
  
  // Method to update read status
  updateReadStatus: (data) => {
    const { directMessages } = get();
    
    // Update the read status of messages
    const updatedMessages = directMessages.map(message => {
      if (
        message.senderId === data.senderId && 
        message.receiverId === data.receiverId &&
        !message.readAt
      ) {
        return {
          ...message,
          readAt: data.readAt
        };
      }
      return message;
    });
    
    set({ directMessages: updatedMessages });
  },
}));