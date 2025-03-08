import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
// import { io } from "socket.io-client";

// const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set) => ({
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
  //     // get().connectSocket();
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
      const res = await axiosInstance.post("/auth/signup", data);
      toast.success(res.data.message);
      return true;
    } catch (error) {
      toast.error(error.res.data.message);
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/signin", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      // get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/signout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // resetPassword: async () => {
  //  try {
  //    const res= await axiosInstance.post("/auth/reset-password", { 
  //       password: formData.password ,
  //       confirmPassword: formData.confirmPassword
  //     });
  //     setResetComplete(true);
  //     toast.success("Password has been reset successfully");
  //     setTimeout(() => {
  //       navigate("/login");
  //     }, 3000); // Navigate to login after 3 seconds
  //   } catch (error) {
  //     const errorMessage = error.response?.data?.message || "Failed to reset password. The link may have expired.";
  //     toast.error(errorMessage);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // },

  //   updateProfile: async (data) => {
  //     set({ isUpdatingProfile: true });
  //     try {
  //       const res = await axiosInstance.put("/auth/update-profile", data);
  //       set({ authUser: res.data });
  //       toast.success("Profile updated successfully");
  //     } catch (error) {
  //       console.log("error in update profile:", error);
  //       toast.error(error.response.data.message);
  //     } finally {
  //       set({ isUpdatingProfile: false });
  //     }
  //   },

  // connectSocket: () => {
  //   const { authUser } = get();
  //   if (!authUser || get().socket?.connected) return;

  //   const socket = io(BASE_URL, {
  //     query: {
  //       userId: authUser._id,
  //     },
  //   });
  //   socket.connect();

  //   set({ socket: socket });

  //   socket.on("getOnlineUsers", (userIds) => {
  //     set({ onlineUsers: userIds });
  //   });
  // },
  // disconnectSocket: () => {
  //   if (get().socket?.connected) get().socket.disconnect();
  // },
}));
