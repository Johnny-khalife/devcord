import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import FriendProfilePage from "./pages/FriendProfilePage";
import CodePlayground from "./pages/CodePlayground";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, socket } = useAuthStore();
  const { theme } = useThemeStore();
  
  // Check authentication on app load and initialize socket connection if authenticated
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Monitor socket connection status for both DM and Channel sockets
  useEffect(() => {
    // Set up event handlers
    const onConnect = (socketType) => () => {
      console.log(`${socketType} socket connected!`);
    };
    
    const onDisconnect = (socketType) => (reason) => {
      console.log(`${socketType} socket disconnected:`, reason);
    };
    
    const onError = (socketType) => (error) => {
      console.error(`${socketType} socket error:`, error);
    };
    
    // DM socket event listeners
    if (socket?.dm) {
      console.log("DM Socket status:", socket.dm.connected ? "Connected" : "Disconnected");
      
      socket.dm.on("connect", onConnect("DM"));
      socket.dm.on("disconnect", onDisconnect("DM"));
      socket.dm.on("error", onError("DM"));
    }
    
    // Channel socket event listeners
    if (socket?.channels) {
      console.log("Channel Socket status:", socket.channels.connected ? "Connected" : "Disconnected");
      
      socket.channels.on("connect", onConnect("Channel"));
      socket.channels.on("disconnect", onDisconnect("Channel"));
      socket.channels.on("error", onError("Channel"));
    }
    
    // Clean up all listeners
    return () => {
      if (socket?.dm) {
        socket.dm.off("connect", onConnect("DM"));
        socket.dm.off("disconnect", onDisconnect("DM"));
        socket.dm.off("error", onError("DM"));
      }
      
      if (socket?.channels) {
        socket.channels.off("connect", onConnect("Channel"));
        socket.channels.off("disconnect", onDisconnect("Channel"));
        socket.channels.off("error", onError("Channel"));
      }
    };
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
        <Route path="/code-playground" element={authUser ? <CodePlayground /> : <Navigate to="/login" />} />
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;