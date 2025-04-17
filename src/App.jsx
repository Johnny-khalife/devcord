import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import FriendProfilePage from "./pages/FriendProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers, socket } = useAuthStore();
  const { theme } = useThemeStore();
  
  // Check authentication on app load and initialize socket connection if authenticated
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Monitor socket connection status
  useEffect(() => {
    if (socket?.dm) {
      console.log("Socket connection status:", socket.dm.connected ? "Connected" : "Disconnected");
      
      // Add connection event listeners
      const onConnect = () => {
        console.log("Socket connected!");
      };
      
      const onDisconnect = (reason) => {
        console.log("Socket disconnected:", reason);
      };
      
      const onError = (error) => {
        console.error("Socket error:", error);
      };
      
      socket.dm.on("connect", onConnect);
      socket.dm.on("disconnect", onDisconnect);
      socket.dm.on("error", onError);
      
      return () => {
        socket.dm.off("connect", onConnect);
        socket.dm.off("disconnect", onDisconnect);
        socket.dm.off("error", onError);
      };
    }
  }, [socket]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />

      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!authUser ? <ForgotPasswordPage /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={!authUser ? <ResetPasswordPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/profile/:id" element={<FriendProfilePage />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;