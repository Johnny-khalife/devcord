import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useWorkspaceStore = create(
  persist(
    (set, get) => ({
      workspacesWithRoles: [],
      selectedWorkspace: null,
      isLoading: false,
      workspacesLoaded: false, // Flag to track if workspaces were loaded
      workspaceMembersCache: {}, // Cache for workspace members to avoid refetching

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
          const response = await axiosInstance.delete(`/workspaces/${workspaceId}`);
          
          // Update local state after successful deletion
          if (onWorkspaceUpdated) onWorkspaceUpdated(workspaceId, null, 'delete');
          if (onClose) onClose();
          
          // Refresh workspaces list
          try {
            await get().getUserWorkspaces();
          } catch (refreshError) {
            
            // Continue with success flow even if refresh fails
          }
          
          toast.success(response.data.message || "Workspace deleted successfully");
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to delete workspace";
          toast.error(errorMessage);
          
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
          await axiosInstance.post(`/workspaces/${workspaceId}/leave`);
          if (onWorkspaceUpdated) onWorkspaceUpdated(workspaceId, null, 'leave');
          if (onClose) onClose();
          toast.success("You have left the workspace");
        } catch (error) {
          const errorMessage = error.response?.data?.messsage || "Failed to leave workspace";
          toast.error(errorMessage);
          throw error;
        } finally {
          setIsLoading(false);
        }
      },

      // Add function to get user workspaces from API
      fetchUserWorkspaces: async () => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get('/workspaces/');
          if (response.data.success) {
            // Only return owned workspaces
            return response.data.workspaces;
          }
          return [];
        } catch (error) {
          
          toast.error("Failed to load your workspaces");
          return [];
        } finally {
          set({ isLoading: false });
        }
      },

      // Add function to get user workspaces from API
      getUserWorkspaces: async (forceRefresh = false) => {
        const { workspacesLoaded, workspacesWithRoles } = get();
        
        // If workspaces are already loaded and we have data, return them unless forceRefresh is true
        if (workspacesLoaded && workspacesWithRoles.length > 0 && !forceRefresh) {
          return workspacesWithRoles;
        }

        set({ isLoading: true });
        try {
          const response = await axiosInstance.get('/workspaces/user');
          if (response.data.success) {
            // Extract and format the workspace data
            const workspaces = response.data.workspaces
              .filter(membership => membership.workspaceId !== null) // Filter out null workspaceIds
              .map(membership => ({
                ...membership.workspaceId,  // Spread the actual workspace data
                _id: membership.workspaceId._id,  // Keep workspace ID
                id: membership.workspaceId._id,   // Add both id and _id for compatibility
                membershipId: membership._id,      // Keep membership ID if needed
                role: membership.role || 'member', // Ensure role is set
                isOwned: membership.role === 'owner',
                isAdmin: membership.role === 'admin'
              }));
            
            set({ workspacesWithRoles: workspaces, workspacesLoaded: true }); // Store workspaces with roles and mark as loaded
            return workspaces;
          }
          return [];
        } catch (error) {
          
          toast.error(error.response?.data?.message || "Failed to load joined workspaces");
          return [];
        } finally {
          set({ isLoading: false });
        }
      },

      // Add function to create a new workspace
      createWorkspace: async (workspaceData) => {
        try {
          
          const response = await axiosInstance.post('/workspaces/', {
           ...workspaceData
          });
          
          
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
      joinWorkspace: async (inviteCode, workspaceId) => {
        try {
          // Get the auth token from localStorage
          const token = localStorage.getItem('auth_token');
          
          // Include the workspaceId parameter if provided
          const endpoint = workspaceId 
            ? `/workspaces/${workspaceId}/join/${inviteCode}?token=${token}` 
            : `/workspaces/${inviteCode}/join?token=${token}`;
            
          const response = await axiosInstance.get(endpoint);
          
          if (response.data.success) {
            // If the response includes a token, update the localStorage
            if (response.data.token) {
              localStorage.setItem('auth_token', response.data.token);
            }
            
            toast.success(response.data.message || "Joined workspace successfully");
            return response.data.workspace;
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to join workspace";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Function to get workspace members with caching
      getWorkspaceMembers: async (workspaceId) => {
        try {
          if (!workspaceId) {
            
            return [];
          }

          // Check if we have cached members for this workspace
          const { workspaceMembersCache } = get();
          if (workspaceMembersCache[workspaceId]) {
            
            return workspaceMembersCache[workspaceId];
          }

          const response = await axiosInstance.get(`/workspaces/${workspaceId}/members`);
          
          if (response.data.success) {
            // Format members to ensure roles are properly set
            const formattedMembers = response.data.members.map(member => ({
              ...member,
              id: member.id || member._id || member.userId,
              role: member.role || 'member', // Ensure role is set
              isAdmin: member.role === 'admin',
              isOwner: member.role === 'owner'
            }));
            
            
            // Cache the members
            set(state => ({
              workspaceMembersCache: {
                ...state.workspaceMembersCache,
                [workspaceId]: formattedMembers
              }
            }));
            
            return formattedMembers;
          } else {
            
            return [];
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Unknown error";
          const status = error.response?.status;
          
          
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
          
          toast.error(error.response?.data?.message)
          return [];
        }
      },

      // Function to promote users to admin
      promoteToAdmin: async (workspaceId, userIds) => {
        try {
          const response = await axiosInstance.post(`/workspaces/${workspaceId}/admins`, {
            userIds: Array.isArray(userIds) ? userIds : [userIds]
          });

          if (response.data.success) {
            // Show success message
            toast.success(response.data.message);
            
            // Return the results for UI updates
            return response.data.results;
          } else {
            throw new Error(response.data.message);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to promote user(s) to admin";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Function to toggle user role between admin and member
      toggleAdminRole: async (workspaceId, userIds) => {
        try {
          const response = await axiosInstance.put(`/workspaces/${workspaceId}/admins`, {
            userIds: Array.isArray(userIds) ? userIds : [userIds]
          });

          if (response.data.success) {
            // Show success message
            toast.success(response.data.message);
            
            // Return the results for UI updates
            return response.data.results;
          } else {
            throw new Error(response.data.message);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to toggle admin role";
          toast.error(errorMessage);
          throw error;
        }
      },

      // Function to remove a member from workspace
      removeMember: async (workspaceId, userId) => {
        try {
          // Get current user's role in the workspace
          const workspaces = get().workspacesWithRoles;
          const currentWorkspace = workspaces.find(w => w.id === workspaceId);
          
          if (!currentWorkspace) {
            throw new Error('Workspace not found');
          }

          // Allow both owners and admins to remove members
          if (currentWorkspace.role !== 'owner' && currentWorkspace.role !== 'admin') {
            throw new Error('You do not have permission to remove members');
          }

          const response = await axiosInstance.delete(`/workspaces/${workspaceId}/members`, {
            data: { userId }
          });

          if (response.data.success) {
            toast.success(response.data.message || "Member removed successfully");
            return true;
          } else {
            throw new Error(response.data.message);
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || "Failed to remove member";
          toast.error(errorMessage);
          throw error;
        }
      },

      setSelectedWorkspace: (selectedWorkspace) => {
        
        
        // Make sure it's a valid object with at least an _id property
        if (!selectedWorkspace) {
          
        } else if (!selectedWorkspace._id) {
          
        }
        
        set({ selectedWorkspace });
      },

      // Clear workspace members cache for a specific workspace
      clearWorkspaceMembersCache: (workspaceId) => {
        if (!workspaceId) return;
        
        set(state => {
          const newCache = { ...state.workspaceMembersCache };
          delete newCache[workspaceId];
          return { workspaceMembersCache: newCache };
        });
      },

      // Force refresh all data
      forceRefresh: async () => {
        set({ 
          workspacesLoaded: false,
          workspaceMembersCache: {}
        });
        return await get().getUserWorkspaces(true);
      },
    }),
    {
      name: "workspace-storage",
    }
  )
);