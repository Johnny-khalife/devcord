import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
// import { io } from "socket.io-client";

export const useAuthStore = create(
  persist(
    (set,get) => ({
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
          console.error("Error fetching users:", error);
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
          console.error("Error fetching user:", error);
          return null;
        } finally {
          set({ isLoading: false });
        }
      },

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/signin", data);
          set({ authUser: res.data.user });
          toast.success("Logged in successfully");
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
          const response = await axiosInstance.post("/auth/signout");
          set({ authUser: null });
          toast.success(response.data.message);
        } catch (error) {
          toast.error(error.response?.data?.message || "Logout failed");
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
          console.log(password);
          const response = await axiosInstance.delete("/users", {
            data: { password }, // Send body inside "data"
            headers: {
              "Content-Type": "application/json", // Ensure JSON content type
            },
          });
          set({ isDeletingAccount: true });
          set({ authUser: null });
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
          const response = await axiosInstance.put("/users/avatar", data);
          console.log(data);
          set({ authUser: response.data.user });
          toast.success(response.data.message);
        } catch (error) {
          toast.error(error.response?.data?.message || "avatar update failed");
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

     
   
    }),
    
    {
      name: "auth-storage", // Store in localStorage
      getStorage: () => localStorage, // Use localStorage
    }
  )
);
