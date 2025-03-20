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
          set({ authUser: res.data.user });
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
          console.log(data)
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
