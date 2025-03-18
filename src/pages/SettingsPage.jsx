import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Eye, EyeOff, Lock, ChevronDown, ChevronUp, Trash2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { 
    changePassword, 
    deleteAccount,
    isChangingPassword: isProcessingPasswordChange,
    isDeletingAccount 
  } = useAuthStore();
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState("");

  // Account deletion state
  const [isDeletingAccountOpen, setIsDeletingAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteFormError, setDeleteFormError] = useState("");
  
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordFormError("");
    
    // Validate passwords
    if (!currentPassword) {
      setPasswordFormError("Current password is required");
      return;
    }
    
    if (!newPassword) {
      setPasswordFormError("New password is required");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordFormError("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordFormError("Password must be at least 6 characters");
      return;
    }
    
    try {
      const success = await changePassword(currentPassword, newPassword);
      
      if (success) {
        // Reset form on success
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      }
    } catch(error){
      setPasswordFormError(error.message("Failed to update password. Please try again."));
    }
  };

  const resetPasswordForm = () => {
    setIsChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordFormError("");
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteFormError("");
    // Validate password
    if (!deleteAccountPassword) {
      setDeleteFormError("Password is required");
      return;
    }

    // Confirm deletion text
    if (deleteConfirm !== "DELETE") {
      setDeleteFormError("Please type DELETE to confirm");
      return;
    }

    try {
      console.log(deleteAccountPassword)
      const success = await deleteAccount(deleteAccountPassword);
      if (success) {
        // Navigate to login page after successful deletion
        navigate("/login");
      }
    } catch (error) {
      setDeleteFormError(error.message("Failed to delete account. Please try again."));
    }
  };

  const resetDeleteForm = () => {
    setIsDeletingAccountOpen(false);
    setDeleteAccountPassword("");
    setDeleteConfirm("");
    setDeleteFormError("");
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl pb-16">
      <div className="space-y-10">
        {/* Theme Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Theme</h2>
            <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`
                  group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                  ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
                `}
                onClick={() => setTheme(t)}
              >
                <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Password Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Account Security</h2>
            <p className="text-sm text-base-content/70">Manage your account security settings</p>
          </div>
          
          <div className="bg-base-200 rounded-lg p-4">
            <div 
              className="flex items-center justify-between cursor-pointer" 
              onClick={() => setIsChangingPassword(!isChangingPassword)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium">Change Password</h3>
                  <p className="text-sm text-base-content/70">Update your account password</p>
                </div>
              </div>
              {isChangingPassword ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            
            {isChangingPassword && (
              <div className="mt-6 border-t border-base-300 pt-4">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  {passwordFormError && (
                    <div className="bg-error/10 border border-error/30 text-error p-3 rounded-md text-sm">
                      {passwordFormError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="input input-bordered w-full pr-10"
                        placeholder="Enter your current password"
                        disabled={isProcessingPasswordChange}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/70 hover:text-base-content"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="input input-bordered w-full pr-10"
                        placeholder="Enter your new password"
                        disabled={isProcessingPasswordChange}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/70 hover:text-base-content"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-base-content/70">Must be at least 6 characters</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input input-bordered w-full pr-10"
                        placeholder="Confirm your new password"
                        disabled={isProcessingPasswordChange}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/70 hover:text-base-content"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={resetPasswordForm}
                      disabled={isProcessingPasswordChange}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-primary ${isProcessingPasswordChange ? "loading" : ""}`}
                      disabled={isProcessingPasswordChange}
                    >
                      Reset Password
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Danger Zone</h2>
            <p className="text-sm text-base-content/70">Actions that can't be undone</p>
          </div>
          
          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <div 
              className="flex items-center justify-between cursor-pointer" 
              onClick={() => setIsDeletingAccountOpen(!isDeletingAccountOpen)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center text-error">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-error">Delete Account</h3>
                  <p className="text-sm text-base-content/70">Permanently delete your account and all data</p>
                </div>
              </div>
              {isDeletingAccountOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            
            {isDeletingAccountOpen && (
              <div className="mt-6 border-t border-error/30 pt-4">
                <div className="bg-error/10 rounded-md p-4 mb-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-error">Warning: This action cannot be undone</h4>
                    <p className="text-sm mt-1">
                      Deleting your account will remove all of your data, conversations, and settings.
                      This action is permanent and cannot be recovered.
                    </p>
                  </div>
                </div>
                
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  {deleteFormError && (
                    <div className="bg-error/10 border border-error/30 text-error p-3 rounded-md text-sm">
                      {deleteFormError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <input
                        type={showDeletePassword ? "text" : "password"}
                        value={deleteAccountPassword}
                        onChange={(e) => setDeleteAccountPassword(e.target.value)}
                        className="input input-bordered w-full pr-10"
                        placeholder="Enter your password to confirm"
                        disabled={isDeletingAccount}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/70 hover:text-base-content"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                      >
                        {showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Confirm Deletion</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="input input-bordered w-full"
                        placeholder="Type DELETE to confirm"
                        disabled={isDeletingAccount}
                      />
                    </div>
                    <p className="text-xs text-base-content/70">
                      Please type DELETE in all caps to confirm
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3 mt-6">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={resetDeleteForm}
                      disabled={isDeletingAccount}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-error ${isDeletingAccount ? "loading" : ""}`}
                      disabled={isDeletingAccount || deleteConfirm !== "DELETE"}
                    >
                      Delete Account
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Preview</h3>
          <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
            <div className="p-4 bg-base-200">
              <div className="max-w-lg mx-auto">
                {/* Mock Chat UI */}
                <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                        D
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Devcord</h3>
                        <p className="text-xs text-base-content/70">Online</p>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                    {PREVIEW_MESSAGES.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`
                            max-w-[80%] rounded-xl p-3 shadow-sm
                            ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                          `}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`
                              text-[10px] mt-1.5
                              ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                            `}
                          >
                            12:00 PM
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="p-4 border-t border-base-300 bg-base-100">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input input-bordered flex-1 text-sm h-10"
                        placeholder="Type a message..."
                        value="This is a preview"
                        readOnly
                      />
                      <button className="btn btn-primary h-10 min-h-0">
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;