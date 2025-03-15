import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useAuthStore = create(
  persist(
    (set) => ({
      authUser: null,
      isSigningUp: false,
      isLoggingIn: false,
      isUpdatingProfile: false,
      isCheckingAuth: true,
      onlineUsers: [],
      socket: null,

      // checkAuth: async () => {
      //   try {
      //     const res = await axiosInstance.get("/auth/check");
      //     set({ authUser: res.data });
      //   } catch (error) {
      //     console.log("Error in checkAuth:", error);
      //     set({ authUser: null });
      //   } finally {
      //     set({ isCheckingAuth: false });
      //   }
      // },

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

      login: async (data) => {
        set({ isLoggingIn: true });
        try {
          const res = await axiosInstance.post("/auth/signin", data);
          set({ authUser: res.data.user});
          console.log("touxxx",res.data)
          toast.success("Logged in successfully");
        } catch (error) {
          toast.error(error.response?.data?.message || "Login failed");
        } finally {
          set({ isLoggingIn: false });
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
          const response = await axiosInstance.post("/auth/forgot-password", { email });
          setEmailSent(true);
          toast.success(response?.data?.message || "Password reset link sent to your email");
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to send reset email.";
          toast.error(errorMessage);
        } finally {
          setIsSubmitting(false);
        }
      },

      resetPassword: async (password, confirmPassword, setResetComplete, setIsSubmitting) => {
        try {
          const response = await axiosInstance.post("/auth/reset-password", { 
            password, 
            confirmPassword 
          });
          setResetComplete(true);
          toast.success(response.data.message || "Password has been reset successfully");
        } catch (error) {
          const errorMessage = error.response?.data?.message || "Failed to reset password.";
          toast.error(errorMessage);
        } finally {
          setIsSubmitting(false);
        }
      },

      updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const response = await axiosInstance.put("/users/social-links", data);
          set({ authUser: response.data.user });
          toast.success(response.data.message);
        } catch (error) {
          toast.error(error.response?.data?.message || "Profile update failed");
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
