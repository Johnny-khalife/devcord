import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useWorkspaceStore = create(
  persist(
    (set) => ({
      workspacesWithRoles: [],
      selectedWorkspace: null, 
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
            // Only return owned workspaces
            return response.data.workspaces;
          }
          return [];
        } catch (error) {
          console.error("Error fetching owned workspaces:", error);
          toast.error("Failed to load your workspaces");
          return [];
        }
      },

      // Add function to get user workspaces from API
      getUserWorkspaces: async () => {
        try {
          const response = await axiosInstance.get('/workspaces/user');
          console.log("API response from getUserWorkspaces:", response.data);
          
          if (response.data.success) {
            // Extract and format the workspace data
            return response.data.workspaces.map(membership => ({
              ...membership.workspaceId,  // Spread the actual workspace data
              _id: membership.workspaceId._id,  // Keep workspace ID
              id: membership.workspaceId._id,   // Add both id and _id for compatibility
              membershipId: membership._id      // Keep membership ID if needed
            }));
          }
          return [];
        } catch (error) {
          console.error("Error fetching joined workspaces:", error);
          toast.error(error.response?.data?.message || "Failed to load joined workspaces");
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
          const response = await axiosInstance.post(`/workspaces/${inviteCode}/join`);
          
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
          if (!workspaceId) {
            console.error("No workspace ID provided to getWorkspaceMembers");
            return [];
          }

          const response = await axiosInstance.get(`/workspaces/${workspaceId}/members`);
          
          if (response.data.success) {
            console.log("Workspace members fetched successfully:", response.data.members);
            return response.data.members || [];
          } else {
            console.error("API returned unsuccessful response:", response.data);
            return [];
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Unknown error";
          const status = error.response?.status;
          
          console.error(`Failed to fetch workspace members (${status}):`, errorMessage);
          toast.error(`Failed to load workspace members: ${errorMessage}`);
          return [];
        }
      },

      sendWorkspaceInvite: async (workspaceId,users,setIsInviteLoading) => {
        try {
          const response = await axiosInstance.post(`/workspaces/${workspaceId}/invite`,{users});
          
          if (response.data.success) {
            setIsInviteLoading(false);
            toast.success(response.data.message);
            return response.data.members;
          }
          return [];
        } catch (error) {
          console.error("Failed to send invite", error);
          toast.error(error.response?.data?.message)
          return [];
        }
      },
      setSelectedWorkspace: (selectedWorkspace) => set({ selectedWorkspace }),      // Other existing methods...
    }),
 
  )
);