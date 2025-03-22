import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useWorkspaceStore = create(
  persist(
    (set) => ({
      // Existing methods...

      updateWorkspace: async (workspaceId, workspaceData, setIsLoading, onSuccess, onClose) => {
        setIsLoading(true);
        try {
          const response = await axiosInstance.put(`/workspaces/${workspaceId}`, {
            workspaceName: workspaceData.workspaceName,
            description: workspaceData.description
          });
          
          if (onSuccess) onSuccess(response.data);
          if (onClose) onClose();
          toast.success("Workspace updated successfully");
          return response.data;
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to update workspace";
          toast.error(errorMessage);
          throw error;
        } finally {
          setIsLoading(false);
        }
      },

      deleteWorkspace: async (workspaceId, setIsLoading, onWorkspaceUpdated, onClose) => {
        setIsLoading(true);
        try {
        const response=  await axiosInstance.delete(`/workspaces/${workspaceId}`);
          if (onWorkspaceUpdated) onWorkspaceUpdated(workspaceId, null, 'delete');
          if (onClose) onClose();
          toast.success(response.data.message ||"Workspace deleted successfully");
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to delete workspace";
          toast.error(errorMessage);
          console.log(error.response)
          throw error;
        } finally {
          setIsLoading(false);
        }
      },

      getWorkspaceInviteUrl: async (workspaceId, setIsLoading, setError) => {
        setIsLoading(true);
        try {
          const response = await axiosInstance.get(`/workspaces/${workspaceId}/invite`);
          
          // Backend returns { success, message, inviteUrl, inviteCode }
          setIsLoading(false);
          return {
            inviteUrl: response.data.inviteUrl,
            inviteCode: response.data.inviteCode
          };
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to generate invite URL";
          if (setError) setError(errorMessage);
          toast.error(errorMessage);
          setIsLoading(false);
          throw error;
        }
      },

      leaveWorkspace: async (workspaceId, setIsLoading, onWorkspaceUpdated, onClose) => {
        setIsLoading(true);
        try {
          await axiosInstance.post(`/api/workspaces/${workspaceId}/leave`);
          if (onWorkspaceUpdated) onWorkspaceUpdated(workspaceId, null, 'leave');
          if (onClose) onClose();
          toast.success("You have left the workspace");
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to leave workspace";
          toast.error(errorMessage);
          throw error;
        } finally {
          setIsLoading(false);
        }
      },

      // Add function to get user workspaces from API
      fetchUserWorkspaces: async () => {
        try {
          const response = await axiosInstance.get('/workspaces/');
          if (response.data.success) {
            set({ workspaces: response.data.workspaces });
            return response.data.workspaces;
          }
        } catch (error) {
          toast.error(error.response.data.message);
          console.error(error);
          return [];
        }
      },

      // Add function to create a new workspace
      createWorkspace: async (workspaceData) => {
        try {
          console.log(workspaceData)
          const response = await axiosInstance.post('/workspaces/', {
           ...workspaceData
          });
          console.log("fgsse")
          
          if (response.data.success) {
            toast.success("Workspace created successfully");
            return response.data.workspace;
          }
        } catch (error) {
          const errorMessage =  "Failed to create workspace";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Function to join a workspace via invite code
      joinWorkspace: async (inviteCode) => {
        try {
          const response = await axiosInstance.post(`/api/workspaces/${inviteCode}/join`);
          
          if (response.data.success) {
            toast.success(response.data.message || "Joined workspace successfully");
            return response.data.workspace;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to join workspace";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Function to get workspace members
      getWorkspaceMembers: async (workspaceId) => {
        try {
          const response = await axiosInstance.get(`/api/workspaces/${workspaceId}/members`);
          
          if (response.data.success) {
            return response.data.members;
          }
          return [];
        } catch (error) {
          console.error("Failed to fetch workspace members:", error);
          return [];
        }
      },

      // Other existing methods...
    }),
    {
      name: "auth-storage",
      getStorage: () => localStorage,
    }
  )
);