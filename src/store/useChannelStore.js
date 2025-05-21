import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useChannelStore = create(
  persist(
    (set, get) => ({
      channelsCache: {}, // Cache object to store channels by workspaceId
      
      // Method to create a new channel in a workspace
      createChannel: async (workspaceId, channelData) => {
        try {
          
          
          const response = await axiosInstance.post(`/workspace/channels/${workspaceId}`, channelData);
          if (response.data.success) {
            // Clear the cache for this workspace since we added a new channel
            get().clearChannelCache(workspaceId);
            
            toast.success(response.data.message || "Channel created successfully");
            return response.data.channel;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Faileddddd to create channel";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Method to fetch channels for a specific workspace with caching
      fetchWorkspaceChannels: async (workspaceId, forceRefresh = false) => {
        try {
          // Check if we have cached channels for this workspace
          const { channelsCache } = get();
          if (!forceRefresh && channelsCache[workspaceId]) {
            
            return channelsCache[workspaceId];
          }
          
          const response = await axiosInstance.get(`/workspace/channels/${workspaceId}`);
          
          if (response.data.success) {
            // Cache the channels
            set(state => ({
              channelsCache: {
                ...state.channelsCache,
                [workspaceId]: response.data.channels
              }
            }));
            
            return response.data.channels;
          }
          return [];
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to fetch channels";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Method to delete a specific channel
      deleteChannel: async (channelId, workspaceId) => {
        try {
          const response = await axiosInstance.delete(`/workspace/channels/${channelId}`);
          
          if (response.data.success) {
            // Clear the cache for this workspace since we deleted a channel
            if (workspaceId) {
              get().clearChannelCache(workspaceId);
            }
            
            toast.success(response.data.message || "Channel deleted successfully");
            return channelId;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to delete channel";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Clear channel cache for a specific workspace
      clearChannelCache: (workspaceId) => {
        if (!workspaceId) return;
        
        set(state => {
          const newCache = { ...state.channelsCache };
          delete newCache[workspaceId];
          return { channelsCache: newCache };
        });
      },
      
      // Force refresh channels for a workspace
      forceRefreshChannels: async (workspaceId) => {
        get().clearChannelCache(workspaceId);
        return await get().fetchWorkspaceChannels(workspaceId, true);
      },

      // add user to private channel
      addUserToChannel: async (channelId, userId, workspaceId) => {
        try {
          const response = await axiosInstance.post(`/workspace/channels/${channelId}/users/${userId}`);
          
          if (response.data.success) {
            // Clear the cache for this workspace since we modified a channel
            if (workspaceId) {
              get().clearChannelCache(workspaceId);
            }
            
            toast.success(response.data.message || "User added to channel successfully");
            return response.data.channel;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to add user to channel";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Method to remove a user from a channel
      removeUserFromChannel: async (channelId, userId, workspaceId) => {
        try {
          const response = await axiosInstance.delete(`/workspace/channels/${channelId}/users/${userId}`);
          
          if (response.data.success) {
            // Clear the cache for this workspace since we modified a channel
            if (workspaceId) {
              get().clearChannelCache(workspaceId);
            }
            
            toast.success(response.data.message || "User removed from channel successfully");
            return response.data.channel;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to remove user from channel";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Function to join a workspace via invite code
      

      // Other existing methods...
    }),
    {
      name: "channel-store",
      partialize: (state) => ({
        // Only persist the cache
        channelsCache: state.channelsCache,
      }),
    }
  )
);