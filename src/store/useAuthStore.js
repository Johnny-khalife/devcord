import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { connectSockets, disconnectSockets, setStoreRefs } from "../lib/socket.js";
import { useChatStore } from "./useChatStore.js";
import { useWorkspaceStore } from "./useWorkspaceStore.js";
import { useChannelStore } from "./useChannelStore.js";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      authUser: null,
      user: null,
      users: [], // Store the fetched users
      isAuthenticated: false,
      isLoading: false,
      isSigningUp: false,
      isLoggingIn: false,
      isUpdatingProfile: false,
      isCheckingAuth: true,
      onlineUsers: [],
      socket: null,
      socketConnectAttempted: false,

      // Initialize sockets and set store references
      initializeSockets: () => {
        
        const authStore = get();
        
        // Don't try to initialize if already attempted and no user
        if (get().socketConnectAttempted && !authStore.authUser) {
          
          return;
        }
        
        set({ socketConnectAttempted: true });
        
        // If no user is authenticated, don't connect
        if (!authStore.authUser) {
          
          return;
        }
        
        const chatStore = useChatStore.getState();
        const workspaceStore = useWorkspaceStore.getState();
        const channelStore = useChannelStore.getState();
        
        // Import friend store to set reference
        try {
          // Use dynamic import to avoid circular dependency
          const friendStoreModule = window?.useFriendStore;
          const friendStore = friendStoreModule ? friendStoreModule.getState() : null;
          
          if (friendStore) {
            // Set store references for socket events
            setStoreRefs(authStore, chatStore, workspaceStore, channelStore, friendStore);
          } else {
            
            // Set other store references without friend store
            setStoreRefs(authStore, chatStore, workspaceStore, channelStore, null);
            
            // Try again in a second
            setTimeout(() => {
              try {
                const laterFriendStore = window?.useFriendStore?.getState();
                if (laterFriendStore) {
                  setStoreRefs(authStore, chatStore, workspaceStore, channelStore, laterFriendStore);
                }
              } catch {
                
              }
            }, 1000);
          }
        } catch (error) {
          // If friend store is not available, still set other store references
          
          setStoreRefs(authStore, chatStore, workspaceStore, channelStore, null);
        }
        
        // Connect to sockets
        
        const socket = connectSockets();
        set({ socket });
        
        // Log socket status
        if (socket?.dm) {
          
        }
        
        if (socket?.channels) {
          
        }
        
        if (socket?.friends) {
          
        }
        
        if (!socket?.dm && !socket?.channels && !socket?.friends) {
          
        }
      },

      getUsers: async (params = {}) => {
        set({ isLoading: true });
        try {
          // Build query parameters for pagination, filtering, etc.
          const queryParams = new URLSearchParams();
          if (params.page) queryParams.append('page', params.page);
          if (params.limit) queryParams.append('limit', params.limit);
          if (params.username) queryParams.append('username', params.username);
          if (params.skills) queryParams.append('skills', params.skills);
          
          const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
          const response = await axiosInstance.get(`/users${queryString}`);
         
          // Ensure we're using the correct property name from the response
          if (response.data.success) {
            set({ 
              users: response.data.users, // Updated to match backend response structure
              isLoading: false 
            });
            return response.data;
          } else {
            throw new Error(response.data.message || "Failed to fetch users");
          }
        } catch (error) {
          set({ isLoading: false });
          const errorMsg = error.response?.data?.message || "Failed to fetch users";
          toast.error(errorMsg);
          
          return null;
        }
      },

      getUserById: async (userId) => {
        set({ isLoading: true });
        try {
          const response = await axiosInstance.get(`/users/${userId}`);
          if (response.data.success) {
            return response.data.user;
          } else {
            throw new Error(response.data.message || "Failed to fetch user");
          }
        } catch (error) {
          const errorMsg = error.response?.data?.message || "Failed to fetch user";
          toast.error(errorMsg);
          
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/signin", data);
          // Store user info for socket and other components
          const userData = res.data.user;
          window.authUser = userData;
          // Always store token in localStorage for mobile compatibility
          if (res.data.token) {
            localStorage.setItem('auth_token', res.data.token);
            // Set a non-HttpOnly cookie for compatibility (expires in 15 days)
            document.cookie = `auth_token=${res.data.token}; path=/; max-age=${15 * 24 * 60 * 60}; SameSite=Lax`;
          }
          set({ 
            authUser: userData,
            isAuthenticated: true,
            socketConnectAttempted: false
          });
          toast.success("Logged in successfully");
          // Initialize sockets after successful login with a delay
          setTimeout(() => {
            get().initializeSockets();
          }, 1000);
        } catch (error) {
          
          toast.error(error.response?.data?.message || "Login failed");
        } finally {
          set({ isLoggingIn: false });
        }
      },

      signup: async (data) => {
        set({ isSigningUp: true });
        try {
          const response = await axiosInstance.post("/auth/signup", data);
          toast.success(response.data.message);
          return true;
        } catch (error) {
          toast.error(error.response?.data?.message || "Signup failed");
          return false;
        } finally {
          set({ isSigningUp: false });
        }
      },

      logout: async () => {
        try {
          // Disconnect sockets before logout
          
          disconnectSockets();
          
          // Clear token from localStorage and global references
          localStorage.clear();
          window.authUser = null;
          sessionStorage.clear();

          set({ 
            socket: null,
            socketConnectAttempted: false 
          });
          
          const response = await axiosInstance.post("/auth/signout");
          set({ 
            authUser: null,
            isAuthenticated: false 
          });
          
          toast.success(response.data.message);
        } catch (error) {
          
          toast.error(error.response?.data?.message || "Logout failed");
          
          // Still clear auth state even if API call fails
          localStorage.removeItem('auth_token');
          window.authUser = null;
          set({ 
            authUser: null,
            isAuthenticated: false,
            socket: null,
            socketConnectAttempted: false
          });
        }
      },

      forgotPassword: async (setEmailSent, setIsSubmitting, email) => {
        try {
          const response = await axiosInstance.post("/auth/forgot-password", {
            email,
          });
          setEmailSent(true);
          toast.success(
            response?.data?.message || "Password reset link sent to your email"
          );
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Failed to send reset email.";
          toast.error(errorMessage);
        } finally {
          setIsSubmitting(false);
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        try {
          const response = await axiosInstance.put("/users/password", {
            currentPassword,
            newPassword,
          });
          set({ isChangingPassword: true });
          toast.success(
            response?.data?.message || "Password changed successfully"
          );
          return true;
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Failed to change password";
          toast.error(errorMessage);
          return false;
        } finally {
          set({ isChangingPassword: false });
        }
      },

      deleteAccount: async (password) => {
        try {
          // Disconnect sockets before deleting account
          
          disconnectSockets();
          set({ 
            socket: null,
            socketConnectAttempted: false 
          });
          
          
          const response = await axiosInstance.delete("/users", {
            data: { password },
            headers: {
              "Content-Type": "application/json",
            },
          });
          set({ isDeletingAccount: true });
          set({ 
            authUser: null,
            isAuthenticated: false
          });
          
          toast.success(
            response.data?.message || "Account deleted successfully"
          );
          return true;
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Failed to delete account";
          toast.error(errorMessage);
          return false;
        } finally {
          set({ isDeletingAccount: false });
        }
      },

      checkAuth: async () => {
        try {
          
          const res = await axiosInstance.get("/auth/status");
          if (res.data.isAuthenticated) {
            
            
            // Store user info globally for socket handlers
            const userData = res.data.user;
            window.authUser = userData;
            
            set({ 
              authUser: userData,
              isAuthenticated: true,
              socketConnectAttempted: false
            });
            
            // Initialize sockets if authenticated
            setTimeout(() => {
              get().initializeSockets();
            }, 1000);
          }
        } catch (error) {
          
          // Clear any stale auth data
          window.authUser = null;
          set({ 
            authUser: null, 
            isAuthenticated: false,
            socket: null,
            socketConnectAttempted: false
          });
        } finally {
          set({ isCheckingAuth: false });
        }
      },

      resetPassword: async (
        password,
        confirmPassword,
        setResetComplete,
        setIsSubmitting
      ) => {
        try {
          const response = await axiosInstance.post("/auth/reset-password", {
            password,
            confirmPassword,
          });
          setResetComplete(true);
          toast.success(
            response.data.message || "Password has been reset successfully"
          );
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || "Failed to reset password.";
          toast.error(errorMessage);
        } finally {
          setIsSubmitting(false);
        }
      },

      updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const response = await axiosInstance.put("/users/profile", data);
          set({ authUser: response.data.user });
          toast.success(response.data.message);
        } catch (error) {
          toast.error(error.response?.data?.message || "Profile update failed");
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      updateAvatar: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          // Ensure we're sending the right format for default avatar
          const payload = data.avatar === null ? { avatar: "" } : data;
          
          const response = await axiosInstance.put("/users/avatar", payload);
          // Update the local user state with the response
          const updatedUser = response.data.user;
          
          // Update only the authUser state, preserving authentication
          set((state) => ({ 
            authUser: { ...state.authUser, ...updatedUser }
          }));
          
          toast.success(response.data.message);
        } catch (error) {
          toast.error(error.response?.data?.message || "Avatar update failed");
        } finally {
          set({ isUpdatingProfile: false });
        }
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        authUser: state.authUser,
      }),
    }
  )
);
