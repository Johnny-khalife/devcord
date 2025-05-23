import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useAuthStore } from "../store/useAuthStore";
import { Loader, CheckCircle, AlertCircle } from "lucide-react";

const WorkspaceInvitePage = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const workspaceId = queryParams.get('workspaceId');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  const { joinWorkspace } = useWorkspaceStore();
  const { authUser, checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Check if user is logged in first
    const handleInvitation = async () => {
      try {
        // If no user, let them sign up or login first
        if (!authUser) {
          // Store the invite details in localStorage to process after login
          localStorage.setItem('pendingInvite', JSON.stringify({
            inviteCode,
            workspaceId,
            path: window.location.pathname + window.location.search
          }));
          
          setStatus('error');
          setMessage('Please log in or sign up to join this workspace');
          return;
        }

        // Try to join the workspace
        const result = await joinWorkspace(inviteCode, workspaceId);
        
        if (result) {
          setWorkspaceName(result.name || 'the workspace');
          setStatus('success');
          setMessage(`You have successfully joined ${result.name || 'the workspace'}`);
          
          // Redirect to the home page after a short delay
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      } catch (error) {
        console.error('Error joining workspace:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to join workspace. The invitation may be invalid or expired.');
      }
    };

    handleInvitation();
  }, [inviteCode, workspaceId, authUser, joinWorkspace, navigate]);

  // Handle login action
  const handleLogin = () => {
    navigate('/login', { 
      state: { 
        redirectAfterLogin: window.location.pathname + window.location.search 
      }
    });
  };

  // Handle signup action
  const handleSignup = () => {
    navigate('/signup', {
      state: {
        redirectAfterSignup: window.location.pathname + window.location.search
      }
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-base-200">
      <div className="m-auto p-8 rounded-lg shadow-lg bg-base-100 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Workspace Invitation</h1>
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-center text-base-content/80">
              Processing your invitation...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-12 h-12 text-success mb-4" />
            <p className="text-center text-base-content/80 mb-4">
              {message}
            </p>
            <p className="text-center text-sm text-base-content/60">
              You will be redirected to the workspace shortly...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-error mb-4" />
            <p className="text-center text-base-content/80 mb-4">
              {message}
            </p>
            
            {!authUser && (
              <div className="flex flex-col space-y-3 w-full mt-2">
                <button 
                  onClick={handleLogin} 
                  className="btn btn-primary"
                >
                  Log In
                </button>
                <button 
                  onClick={handleSignup} 
                  className="btn btn-outline btn-primary"
                >
                  Sign Up
                </button>
              </div>
            )}
            
            {authUser && (
              <button 
                onClick={() => navigate('/')} 
                className="btn btn-primary mt-2"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceInvitePage; 