import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useFriendStore = create(
  persist(
    (set, get) => ({
      // State
      friendRequests: [],
      sentRequests: [],
      friends: [],
      blockedUsers: [],
      isLoading: false,
      error: null,
      dataLoaded: false,

      // Get all friend requests received by the current user
      getFriendRequests: async () => {
        const { dataLoaded, friendRequests } = get();
        
        if (dataLoaded && friendRequests.length > 0) {
          return friendRequests;
        }
        
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get("/friends/requests");
          set({ friendRequests: response.data.data, isLoading: false, dataLoaded: true });
          return response.data.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to fetch friend requests", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to fetch friend requests");
          return [];
        }
      },

      // Get all pending friend requests sent by the current user
      getSentFriendRequests: async () => {
        const { dataLoaded, sentRequests } = get();
        
        if (dataLoaded && sentRequests.length > 0) {
          return sentRequests;
        }
        
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get("/friends/requests/sent");
          set({ sentRequests: response.data.data, isLoading: false, dataLoaded: true });
          return response.data.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to fetch sent requests", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to fetch sent requests");
          return [];
        }
      },

      // Accept a friend request
      acceptFriendRequest: async (requestId) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.put(`/friends/requests/${requestId}/accept`);
          
          // Update the friendRequests list to remove the accepted request
          const updatedRequests = get().friendRequests.filter(
            (request) => request.requestId !== requestId
          );
          
          // Refresh friends list after accepting request
          await get().getFriendsList();
          
          set({ friendRequests: updatedRequests, isLoading: false });
          toast.success("Friend request accepted");
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to accept friend request", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to accept friend request");
          return null;
        }
      },

      // Decline a friend request
      declineFriendRequest: async (requestId) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.delete(`/friends/requests/${requestId}/decline`);
          
          // Update the friendRequests list to remove the declined request
          const updatedRequests = get().friendRequests.filter(
            (request) => request.requestId !== requestId
          );
          
          set({ friendRequests: updatedRequests, isLoading: false });
          toast.success("Friend request declined");
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to decline friend request", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to decline friend request");
          return null;
        }
      },

      // Get list of friends for the current user
      getFriendsList: async (forceRefresh = false) => {
        const { dataLoaded, friends } = get();
        
        if (dataLoaded && friends.length > 0 && !forceRefresh) {
          return friends;
        }
        
        set({ isLoading: true });
        try {
          console.log("getFriendsList is called", get().friends);	
          const response = await axiosInstance.get("/friends");
          set({ friends: response.data.data, isLoading: false, dataLoaded: true });
          console.log(response.data);
          return response.data.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to fetch friends list", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to fetch friends list");
          return [];
        }
      },

      // Send a friend request
      sendFriendRequest: async (userId) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.post(`/friends/${userId}/add-friend`);
          // Refresh sent requests
          await get().getSentFriendRequests();
          set({ isLoading: false });
          toast.success("Friend request sent successfully");
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to send friend request", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to send friend request");
          return null;
        }
      },

      // Remove a friend
      removeFriend: async (userId) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.delete(`/friends/${userId}`);
          
          // Update the friends list to remove the friend
          const updatedFriends = get().friends.filter(
            (friend) => friend.friendId !== userId
          );
          
          set({ friends: updatedFriends, isLoading: false });
          toast.success("Friend removed successfully");
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to remove friend", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to remove friend");
          return null;
        }
      },

      // Block a user
      blockUser: async (userId, blockReason = "") => {
        set({ isLoading: true });
        try {
          // Add blocking metadata
          const blockData = {
            userId,
            blockReason,
            blockedAt: new Date().toISOString()
          };
          
          const response = await axiosInstance.post(`/friends/${userId}/block`, blockData);
          
          // Refresh blocked users list
          await get().getBlockedUsers();
          
          // Also remove from friends list if they were a friend
          const updatedFriends = get().friends.filter(
            (friend) => friend.friendId !== userId
          );
          
          // Remove any pending friend requests from this user
          const updatedRequests = get().friendRequests.filter(
            (request) => request.senderId !== userId
          );
          
          // Remove any sent friend requests to this user
          const updatedSentRequests = get().sentRequests.filter(
            (request) => request.receiverId !== userId
          );
          
          set({ 
            friends: updatedFriends,
            friendRequests: updatedRequests,
            sentRequests: updatedSentRequests,
            isLoading: false 
          });
          
          toast.success("User blocked successfully");
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to block user", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to block user");
          return null;
        }
      },

      // Unblock a user
      unblockUser: async (userId) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.delete(`/friends/${userId}/block`, { data: { userId } });
          
          // Update the blockedUsers list to remove the unblocked user
          const updatedBlockedUsers = get().blockedUsers.filter(
            (user) => user.id !== userId
          );
          
          set({ blockedUsers: updatedBlockedUsers, isLoading: false });
          toast.success("User unblocked successfully");
          return response.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to unblock user", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to unblock user");
          return null;
        }
      },

      // Get list of blocked users
      getBlockedUsers: async () => {
        const { dataLoaded, blockedUsers } = get();
        
        if (dataLoaded && blockedUsers.length > 0) {
          return blockedUsers;
        }
        
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get("/friends/block");
          set({ blockedUsers: response.data.data, isLoading: false, dataLoaded: true });
          return response.data.data;
        } catch (error) {
          set({ error: error.response?.data?.message || "Failed to fetch blocked users", isLoading: false });
          toast.error(error.response?.data?.message || "Failed to fetch blocked users");
          return [];
        }
      },

      // Initialize the store by loading all necessary data
      initialize: async () => {
        try {
          await Promise.all([
            get().getFriendsList(),
            get().getFriendRequests(),
            get().getSentFriendRequests(),
            get().getBlockedUsers()
          ]);
        } catch (error) {
          console.error("Failed to initialize friend store:", error);
        }
      },

      // Reset store
      reset: () => {
        set({
          friendRequests: [],
          sentRequests: [],
          friends: [],
          blockedUsers: [],
          isLoading: false,
          error: null,
          dataLoaded: false
        });
      },
      
      // Force refresh data
      forceRefresh: async () => {
        set({ dataLoaded: false });
        await get().initialize();
      }
    }),
    {
      name: "friend-storage",
      getStorage: () => localStorage,
    }
  )
);