import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useChannelStore = create(
  persist(
    () => ({
      // Existing methods...

      // Method to create a new channel in a workspace
      createChannel: async (workspaceId, channelData) => {
        try {
          console.log(channelData.allowedUsers)
          console.log("it's the workspace id ",channelData)
          const response = await axiosInstance.post(`/workspace/channels/${workspaceId}`, channelData);
          if (response.data.success) {
            toast.success(response.data.message || "Channel created successfully");
            return response.data.channel;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to create channel";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Method to fetch channels for a specific workspace
      fetchWorkspaceChannels: async (workspaceId) => {
        try {
          const response = await axiosInstance.get(`/workspace/channels/${workspaceId}`);
          
          if (response.data.success) {
            return response.data.channels;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to fetch channels";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Method to delete a specific channel
      deleteChannel: async (channelId) => {
        try {
          const response = await axiosInstance.delete(`/workspace/channels/${channelId}`);
          
          if (response.data.success) {
            toast.success(response.data.message || "Channel deleted successfully");
            return channelId;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to delete channel";
          toast.error(errorMessage);
          throw error;
        }
      },

      //add user to private channel
      addUserToChannel: async (channelId, userId) => {
        try {
          const response = await axiosInstance.post(`/workspace/channels/${channelId}/users/${userId}`);
          
          if (response.data.success) {
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
      removeUserFromChannel: async (channelId, userId) => {
        try {
          const response = await axiosInstance.delete(`/workspace/channels/${channelId}/users/${userId}`);
          
          if (response.data.success) {
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
   
  )
);