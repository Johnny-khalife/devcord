import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { sendChannelMessage } from "../lib/socket";

export const useChatStore = create((set, get) => ({
  messages: [],
  directMessages: [],
  users: [],
  selectedFriend: null,
  selectedChannel: null, // Track currently selected channel
  isUsersLoading: false,
  isMessagesLoading: false,
  isDeletingMessage: false,
  isReacting: false,
  isSearching: false,
  searchResults: [],
  searchQuery: "",
  searchPagination: null,
  typingIndicators: {}, // Track which users are typing
  channelTypingIndicators: {}, // Track users typing in channels
  isSendingMessage: false,
  
  getCurrentChannelId: () => {
    const { selectedChannel } = get();
    return selectedChannel ? selectedChannel._id : null;
  },
  
  setSelectedChannel: (channel) => {
    set({ selectedChannel: channel });
  },
  
  updateSentMessage: (messageId, serverMessage) => {
    const { messages } = get();
    
    const hasTempMessage = messages.some(msg => msg._id.startsWith('temp-'));
    
    if (hasTempMessage) {
      const updatedMessages = messages.map(msg => 
        msg._id.startsWith('temp-') ? serverMessage : msg
      );
      
      set({ messages: updatedMessages });
    } else {
      set({ messages: [...messages, serverMessage] });
    }
  },

  getMessages: async (channelId) => {
    if (!channelId) return;
    
    set({ isMessagesLoading: true });
    try {
      // Set selected channel for socket filtering
      set({ selectedChannel: { _id: channelId } });
      
      const res = await axiosInstance.get(`/messages/${channelId}`);
      const messagesData = res.data.data.messages || [];
      
      set({ 
        messages: messagesData,
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
      console.log("directMessages", messagesData);
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

  sendMessage: async (messageData, workspaceId) => {
    if (!workspaceId) {
      console.error("No workspace ID provided for channel message");
      return;
    }

    try {
      set({ isSendingMessage: true });

      // Prepare message for optimistic update
      const authUser = window.authUser || 
                      JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser || 
                      useAuthStore.getState().authUser;
      
      if (!authUser) {
        console.error("No authenticated user found for sending message");
        toast.error("You must be logged in to send messages");
        set({ isSendingMessage: false });
        return;
      }

      // Get the channel ID from messageData or selected channel
      const { selectedChannel } = get();
      let channelId = messageData.channelId || selectedChannel?._id || workspaceId;
      
      // Create an optimistic message to show immediately
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        content: messageData.message || messageData.content, // Support both properties
        image: messageData.image,
        senderId: authUser._id,
        userId: authUser._id,
        sender: {
          userId: authUser._id,
          username: authUser.username,
          avatar: authUser.avatar
        },
        workspaceId: workspaceId,
        channelId: channelId,
        createdAt: new Date().toISOString(),
        isSentByMe: true,
        isPending: true
      };

      // Add optimistic message to state
      set((state) => ({
        messages: [...state.messages, optimisticMessage]
      }));
      
      console.log(`Sending message to channel ${channelId} in workspace ${workspaceId}`);
      
      // Get socket from auth store
      const { socket } = useAuthStore.getState();
      
      // Try to send via socket first - this is the preferred method
      let socketSent = false;
      
      if (socket && socket.channels && socket.channels.connected) {
        console.log("Sending message via socket");
        socketSent = sendChannelMessage(
          channelId,
          {
            message: messageData.message || messageData.content,
            image: messageData.image
          },
          workspaceId
        );
        
        // Socket handling will update the message via updateSentMessage when the server confirms
        
        // Set a timeout to mark as not pending if no server response
        setTimeout(() => {
          set((state) => {
            // Only update if message is still pending
            const isPending = state.messages.some(
              msg => msg._id === optimisticMessage._id && msg.isPending
            );
            
            if (isPending) {
              return {
                messages: state.messages.map(msg => 
                  msg._id === optimisticMessage._id ? 
                  { ...msg, isPending: false } : msg
                )
              };
            }
            return state;
          });
        }, 3000);
      } else {
        console.log("Socket not connected, using API");
        
        // Fall back to API if socket isn't available
        // Prepare API request data
        const apiMessageData = {
          message: messageData.message || messageData.content,
          image: messageData.image
        };
        
        // Send API request
        const response = await axiosInstance.post(
          `/messages/${channelId}`, 
          apiMessageData
        );
        
        console.log("API message response:", response.data);
        
        if (response.data && response.data.data) {
          const serverData = response.data.data;
          
          // Replace optimistic message with server response
          set((state) => ({
            messages: state.messages.map(msg => 
              msg._id === optimisticMessage._id ? 
              {
                ...serverData,
                isSentByMe: true,
                isPending: false
              } : msg
            )
          }));
        } else {
          // Just mark as not pending if server data is not available
          set((state) => ({
            messages: state.messages.map(msg => 
              msg._id === optimisticMessage._id ? 
              { ...msg, isPending: false } : msg
            )
          }));
        }
      }

      set({ isSendingMessage: false });
    } catch (error) {
      console.error("Failed to send message:", error);
      
      // Remove the optimistic message on failure
      set((state) => ({
        messages: state.messages.filter(msg => !msg._id.startsWith('temp-')),
        isSendingMessage: false
      }));
      
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  sendDirectMessage: async (messageData, friendId) => {
    if (!friendId) {
      toast.error("Friend ID is required");
      return;
    }
    
    // Set sending state to prevent multiple submissions
    set({ isSendingMessage: true });
    
    // Generate a temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;
    
    // Get the current user ID
    const authUser = JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser;
    
    // Create an optimistic message
    const optimisticMessage = {
      _id: tempId,
      content: messageData.message,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isSentByMe: true, // Explicitly set this for optimistic update
      isPending: true, // Flag to indicate this is a pending message
      senderId: authUser?._id || 'current-user', // Add user ID to ensure proper positioning
      sender: {
        userId: authUser?._id || 'current-user',
        username: authUser?.username || 'You',
        avatar: authUser?.avatar
      }
    };
    
    // Add the optimistic message to the UI immediately
    set((state) => ({
      directMessages: [...state.directMessages, optimisticMessage]
    }));
    
    try {
      // Disable the send button for this message
      const sendButton = document.querySelector(`button[type="submit"]`);
      if (sendButton) {
        sendButton.disabled = true;
      }
      
      const requestData = {
        content: messageData.message,
        isCode: false,
        language: "text",
        image: messageData.image
      };
      
      const response = await axiosInstance.post(
        `/direct-messages/friend/${friendId}`, 
        requestData
      );
      
      const newMessage = response.data.data;
      console.log("Sending direct message with data:", newMessage);

      // Replace the optimistic message with the real one, ensuring correct structure
      set((state) => ({
        directMessages: state.directMessages.map(msg => 
          msg._id === tempId ? { 
            ...newMessage,
            _id: newMessage.messageId || newMessage._id, // Ensure messageId is properly mapped to _id
            isSentByMe: true // Make sure this is explicitly set
          } : msg
        )
      }));
      
      return newMessage;
    } catch (error) {
      console.error("Error in sendDirectMessage:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to send direct message");
      }
      
      // Remove the failed optimistic message
      set((state) => ({
        directMessages: state.directMessages.filter(msg => msg._id !== tempId)
      }));
    } finally {
      // Enable the send button again
      const sendButton = document.querySelector(`button[type="submit"]`);
      if (sendButton) {
        sendButton.disabled = false;
      }
      set({ isSendingMessage: false });
    }
  },

  deleteMessage: async (messageId, channelId, isDirect = false) => {
    console.log("deleteMessage called with:", { messageId, channelId, isDirect });
    
    if (!messageId) {
      console.error("Missing messageId in deleteMessage");
      toast.error("Message ID is requiredddd");
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
      _id: messageData.messageId || messageData._id || messageData.id || `temp-${Date.now()}`,
      content: messageData.message || messageData.content,
      image: messageData.image,
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
  
  // Remove a direct message from the store
  removeDirectMessage: (messageId) => {
    console.log("Marking direct message as deleted:", messageId);
    const { directMessages } = get();
    
    // Update the message to be marked as deleted instead of removing it
    const updatedMessages = directMessages.map(msg => {
      if (msg._id === messageId) {
        return {
          ...msg,
          isDeleted: true
        };
      }
      return msg;
    });
    
    set({
      directMessages: updatedMessages
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

  // Add a channel message received via socket
  addChannelMessage: (messageData) => {
    console.log("Adding channel message to store:", messageData);
    
    if (!messageData) {
      console.error("Invalid channel message data received");
      return;
    }
    
    // Get the current messages, auth info, and selected workspace
    const { messages } = get();
    const authUser = window.authUser || 
                     JSON.parse(localStorage.getItem('auth-store'))?.state?.authUser || 
                     useAuthStore.getState().authUser;
    
    if (!authUser) {
      console.error("Cannot add channel message: No authenticated user found");
      return;
    }
    
    // Check if message already exists in store to avoid duplicates
    const msgExists = messages.some(msg => 
      (msg._id && msg._id === messageData._id) || 
      (msg.content === messageData.content && 
       msg.sender?.userId === messageData.sender?.userId && 
       Math.abs(new Date(msg.createdAt) - new Date(messageData.createdAt || messageData.timestamp)) < 1000)
    );
    
    if (msgExists) {
      console.log("Channel message already exists in store, skipping");
      return;
    }
    
    // Get senderId - handle both object and string formats
    const senderId = messageData.senderId || messageData.sender?.userId;
    
    // Determine if message is from current user
    const isFromCurrentUser = messageData.isSentByMe !== undefined 
      ? messageData.isSentByMe 
      : (authUser && senderId === authUser._id);
    
    // Create a standardized message format that correctly handles sender information
    const newMessage = {
      _id: messageData._id || `socket-${Date.now()}`,
      content: messageData.content || messageData.message,
      image: messageData.image,
      userId: messageData.userId || senderId,
      senderId: senderId,
      sender: messageData.sender || {
        userId: senderId,
        username: messageData.senderName || (isFromCurrentUser ? authUser.username : 'Unknown User'),
        avatar: messageData.senderAvatar
      },
      channelId: messageData.channelId,
      workspaceId: messageData.workspaceId,
      createdAt: messageData.createdAt || messageData.timestamp || new Date().toISOString(),
      isSentByMe: isFromCurrentUser
    };
    
    console.log("Adding formatted channel message:", newMessage);
    
    // Add to messages store
    set({
      messages: [...messages, newMessage]
    });
  },
  
  // Track channel typing indicators
  setChannelTypingIndicator: (data) => {
    if (!data || !data.channelId) return;
    
    const { userId, channelId, isTyping, username } = data;
    
    set((state) => {
      // Get current channel typing indicators
      const currentChannelTyping = state.channelTypingIndicators[channelId] || {};
      
      if (isTyping) {
        // Add or update user typing status
        return {
          channelTypingIndicators: {
            ...state.channelTypingIndicators,
            [channelId]: {
              ...currentChannelTyping,
              [userId]: {
                timestamp: Date.now(),
                username
              }
            }
          }
        };
      } else {
        // Remove user from typing
        const updatedChannelTyping = { ...currentChannelTyping };
        delete updatedChannelTyping[userId];
        
        return {
          channelTypingIndicators: {
            ...state.channelTypingIndicators,
            [channelId]: updatedChannelTyping
          }
        };
      }
    });
    
    // Clear typing indicator after timeout
    if (isTyping) {
      setTimeout(() => {
        set((state) => {
          const currentChannelTyping = state.channelTypingIndicators[channelId] || {};
          const userTyping = currentChannelTyping[userId];
          
          // Only clear if hasn't been updated recently
          if (userTyping && Date.now() - userTyping.timestamp > 3000) {
            const updatedChannelTyping = { ...currentChannelTyping };
            delete updatedChannelTyping[userId];
            
            return {
              channelTypingIndicators: {
                ...state.channelTypingIndicators,
                [channelId]: updatedChannelTyping
              }
            };
          }
          
          return state;
        });
      }, 3500);
    }
  },
  
  // Get typing users for a specific channel
  getChannelTypingUsers: (channelId) => {
    const { channelTypingIndicators } = get();
    const channelTyping = channelTypingIndicators[channelId] || {};
    
    return Object.entries(channelTyping)
      .map(([userId, data]) => ({
        userId,
        username: data.username
      }));
  },
}));