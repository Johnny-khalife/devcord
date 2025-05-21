import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendsStore";
import {
  Mail,
  Code,
  Github,
  Linkedin,
  ArrowLeft,
  Calendar,
  User,
  Globe,
  Shield,
  Clock,
  ExternalLink,
  MapPin,
  Briefcase,
  MessageSquare,
  UserMinus,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Clock as ClockIcon,
  ShieldAlert,
  Ban
} from "lucide-react";
import { toast } from "react-hot-toast";

const FriendProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromSearchPortal = location.state?.fromSearchPortal || false;
  const { getUserById } = useAuthStore();
  const { 
    friends, 
    sentRequests, 
    friendRequests,
    blockedUsers,
    sendFriendRequest, 
    removeFriend, 
    getFriendsList, 
    getSentFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    blockUser,
    unblockUser,
    getBlockedUsers
  } = useFriendStore();
  
  const [friendProfile, setFriendProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("This profile doesn't exist or may have been removed.");
  const [relationshipStatus, setRelationshipStatus] = useState('none'); // none, friend, sent, received
  const [actionLoading, setActionLoading] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const fetchController = useRef(null);
  const hasFetched = useRef(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Check relationship status with the profile user
  useEffect(() => {
    const checkRelationshipStatus = () => {
      // Check if user is already a friend
      const isAlreadyFriend = friends.some(friend => 
        friend.friendId === id || friend.id === id);
      
      if (isAlreadyFriend) {
        setRelationshipStatus('friend');
        return;
      }
      
      // Check if we've sent a request to this user
      const hasSentPendingRequest = sentRequests.some(request => 
        request.receiverId === id);
      
      if (hasSentPendingRequest) {
        setRelationshipStatus('sent');
        return;
      }
      
      // Check if we've received a request from this user
      const hasReceivedPendingRequest = friendRequests.some(request => 
        request.senderId === id);
      
      if (hasReceivedPendingRequest) {
        setRelationshipStatus('received');
        return;
      }
      
      // No relationship
      setRelationshipStatus('none');
    };
    
    checkRelationshipStatus();
  }, [id, friends, sentRequests, friendRequests]);

  // Check if the user is blocked
  useEffect(() => {
    const checkIfBlocked = () => {
      const userIsBlocked = blockedUsers.some(user => user.id === id);
      setIsBlocked(userIsBlocked);
    };
    
    checkIfBlocked();
  }, [id, blockedUsers]);

  // Initial load of blocked users
  useEffect(() => {
    getBlockedUsers();
  }, [getBlockedUsers]);

  // Fetch profile data
  useEffect(() => {
    // Reset states when ID changes and set up a new fetch
    setIsLoading(true);
    setError(false);
    hasFetched.current = false;
    
    // Create an AbortController to cancel previous requests
    if (fetchController.current) {
      fetchController.current.abort();
    }
    fetchController.current = new AbortController();
    
    const fetchFriendProfile = async () => {
      // Prevent multiple fetch attempts for the same ID
      if (hasFetched.current) return;
      hasFetched.current = true;
      
      try {
        // First check if the user is blocked
        if (blockedUsers.some(user => user.id === id)) {
          setError(true);
          setErrorMessage("You cannot view this profile because you have blocked this user");
          setIsLoading(false);
          return;
        }
        
        const profile = await getUserById(id);
        
        // Handle non-existent profile or error cases
        if (!profile) {
          setError(true);
          setErrorMessage("This profile doesn't exist or may have been removed.");
        } else {
          setFriendProfile(profile);
        }
      } catch {
        setError(true);
        setErrorMessage("Unable to load profile data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch with a small delay to prevent rapid consecutive requests
    const timeoutId = setTimeout(() => {
      fetchFriendProfile();
    }, 300);

    // Cleanup function to cancel the request if component unmounts or ID changes
    return () => {
      clearTimeout(timeoutId);
      if (fetchController.current) {
        fetchController.current.abort();
      }
    };
  }, [id, getUserById, blockedUsers]);

  // Handle relationship actions (add/remove/accept/decline)
  const handleRelationshipAction = async () => {
    setActionLoading(true);
    
    try {
      switch (relationshipStatus) {
        case 'friend':
          // Remove friend
          await removeFriend(id);
          setRelationshipStatus('none');
          break;
          
        case 'none':
          // Send friend request
          await sendFriendRequest(id);
          setRelationshipStatus('sent');
          break;
          
        case 'received': {
          // Get the request ID (using block scope to avoid lexical declaration error)
          const requestToAccept = friendRequests.find(request => request.senderId === id);
          if (requestToAccept) {
            await acceptFriendRequest(requestToAccept.requestId);
            setRelationshipStatus('friend');
          }
          break;
        }
          
        default:
          // For 'sent' state, we do nothing as the request is already sent
          break;
      }
      
      // Refresh friend lists and requests
      await Promise.all([
        getFriendsList(),
        getSentFriendRequests()
      ]);
    } catch {
      // Toast errors are handled by the store itself
    } finally {
      setActionLoading(false);
    }
  };

  // Handle declining a friend request
  const handleDeclineRequest = async () => {
    setActionLoading(true);
    
    try {
      const requestToDecline = friendRequests.find(request => request.senderId === id);
      if (requestToDecline) {
        await declineFriendRequest(requestToDecline.requestId);
        setRelationshipStatus('none');
      }
    } catch {
      // Toast errors are handled by the store itself
    } finally {
      setActionLoading(false);
    }
  };

  // Handle blocking a user
  const handleBlockUser = async () => {
    setActionLoading(true);
    try {
      await blockUser(id);
      setIsBlocked(true);
      toast.success(`${friendProfile.username} has been blocked`);
      setShowBlockModal(false);
    } catch (error) {
      
      toast.error("Failed to block user");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle unblocking a user
  const handleUnblockUser = async () => {
    setActionLoading(true);
    try {
      await unblockUser(id);
      setIsBlocked(false);
      toast.success(`${friendProfile.username} has been unblocked`);
    } catch (error) {
      
      toast.error("Failed to unblock user");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle back button click
  const handleBackClick = () => {
    if (fromSearchPortal) {
      // Navigate to home page with state to reopen search portal
      navigate("/", { state: { openSearchPortal: true } });
    } else {
      // Default back behavior
      navigate(-1);
    }
  };

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 bg-gray-900 flex items-center justify-center">
        <div className="max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 w-24 bg-gray-800 rounded-md mb-6 animate-pulse"></div>
          
          <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-pulse">
            {/* Hero section skeleton */}
            <div className="h-56 bg-gray-700"></div>
            
            {/* Profile info skeleton */}
            <div className="px-8 py-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar skeleton */}
                <div className="w-32 h-32 rounded-full bg-gray-700 border-4 border-gray-800 -mt-24 md:-mt-20"></div>
                
                <div className="space-y-4 flex-1 mt-4 md:mt-0">
                  <div className="h-8 bg-gray-700 rounded-md w-64"></div>
                  <div className="h-4 bg-gray-700 rounded-md w-40"></div>
                  
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-gray-700 rounded-xl"></div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-48 bg-gray-700 rounded-xl"></div>
                  <div className="h-40 bg-gray-700 rounded-xl"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-64 bg-gray-700 rounded-xl"></div>
                  <div className="h-48 bg-gray-700 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile not found or error state
  if (error || !friendProfile) {
    const isBlockedError = errorMessage.includes("blocked this user");
    
    return (
      <div className="min-h-screen pt-16 bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800 rounded-2xl shadow-xl max-w-md mx-auto border border-gray-700">
          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            {isBlockedError ? (
              <ShieldAlert size={32} className="text-red-500" />
            ) : (
              <AlertTriangle size={32} className="text-amber-500" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {isBlockedError ? "Profile Blocked" : "Profile Not Found"}
          </h1>
          <p className="text-gray-400 mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => {
              if (fromSearchPortal) {
                navigate('/', { state: { openSearchPortal: true } });
              } else {
                navigate(-1);
              }
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={18} />
            <span>Back to Friends</span>
          </button>
        </div>
      </div>
    );
  }

  // Format date for better readability
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    if (isNaN(date)) return "Not available";
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get time since for last login
  const getTimeSince = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    if (isNaN(date)) return "Not available";
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return "Just now";
  };

  // Calculate online status
  const getStatusStyles = (status) => {
    if (!status) return { color: "text-gray-400", bg: "bg-gray-500" };
    
    switch(status.toLowerCase()) {
      case "online":
        return { color: "text-green-400", bg: "bg-green-500" };
      case "away":
        return { color: "text-yellow-400", bg: "bg-yellow-500" };
      case "busy":
        return { color: "text-red-400", bg: "bg-red-500" };
      case "offline":
        return { color: "text-gray-400", bg: "bg-gray-500" };
      default:
        return { color: "text-green-400", bg: "bg-green-500" };
    }
  };

  const statusStyles = getStatusStyles(friendProfile.status);

  // Get relationship button properties
  const getRelationshipButtonProps = () => {
    switch (relationshipStatus) {
      case 'friend':
        return {
          icon: <UserMinus size={16} />,
          text: 'Remove Friend',
          bgClass: 'bg-red-600 hover:bg-red-700',
          disabled: actionLoading,
          onClick: handleRelationshipAction
        };
      case 'sent':
        return {
          icon: <ClockIcon size={16} />,
          text: 'Request Sent',
          bgClass: 'bg-gray-600 cursor-not-allowed',
          disabled: true,
          onClick: null
        };
      case 'received':
        return {
          icon: <CheckCircle size={16} />,
          text: 'Accept Request',
          bgClass: 'bg-green-600 hover:bg-green-700',
          disabled: actionLoading,
          onClick: handleRelationshipAction
        };
      default: // 'none'
        return {
          icon: <UserPlus size={16} />,
          text: 'Add Friend',
          bgClass: 'bg-indigo-600 hover:bg-indigo-700',
          disabled: actionLoading,
          onClick: handleRelationshipAction
        };
    }
  };

  const relationshipButton = getRelationshipButtonProps();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pt-16">
      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
            <div className="p-4 border-b border-gray-700 flex items-center gap-3">
              <div className="p-2 bg-red-900/30 rounded-full">
                <Ban size={20} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-white">Block {friendProfile.username}</h3>
            </div>
            
            <div className="p-6">
              <p className="mb-4 text-sm text-gray-300">
                Blocking this user will:
              </p>
              
              <ul className="mb-6 space-y-2 text-sm text-gray-400 pl-5">
                <li className="list-disc">Prevent them from messaging you</li>
                <li className="list-disc">Remove them from your friends list</li>
                <li className="list-disc">Cancel any pending friend requests</li>
                <li className="list-disc">Hide your activity from them</li>
              </ul>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBlockUser}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Ban size={16} />
                      <span>Block User</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <button
          onClick={handleBackClick}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-indigo-600 transition-colors">
            <ArrowLeft size={18} className="group-hover:text-white" />
          </div>
          <span className="font-medium">Back</span>
        </button>

        {/* Main Profile Card */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-gray-700/50">
          {/* Hero banner */}
          <div className="h-56 bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-800 relative">
            {/* Optional hero image */}
          </div>

          {/* Profile container */}
          <div className="px-6 sm:px-8 lg:px-10 py-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar */}
              <div className="relative -mt-24 md:-mt-20">
                <div className="w-32 h-32 rounded-full ring-4 ring-gray-800 overflow-hidden bg-gray-700 shadow-xl">
                  {friendProfile.avatar ? (
                    <img
                      src={friendProfile.avatar}
                      alt={`${friendProfile.username}'s avatar`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={40} />
                    </div>
                  )}
                </div>
                <div className={`absolute bottom-2 right-2 w-4 h-4 ${statusStyles.bg} rounded-full ring-2 ring-gray-800`}></div>
              </div>

              {/* Profile header & stats */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{friendProfile.username}</h1>
                  <p className={`flex items-center gap-2 ${statusStyles.color} mt-1`}>
                    {friendProfile.status || "Online"}
                  </p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
                  <div className="flex items-center gap-3 rounded-xl bg-gray-700/30 p-4 border border-gray-600/20 transition-all hover:bg-gray-700/50">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Member Since</p>
                      <p className="text-sm font-medium text-white">{formatDate(friendProfile.createdAt || new Date())}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-gray-700/30 p-4 border border-gray-600/20 transition-all hover:bg-gray-700/50">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-400">
                      <Code size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Skills</p>
                      <p className="text-sm font-medium text-white">{friendProfile.skills?.length || 0} listed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-gray-700/30 p-4 border border-gray-600/20 transition-all hover:bg-gray-700/50">
                    <div className="w-10 h-10 rounded-lg bg-cyan-600/30 flex items-center justify-center text-cyan-400">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Last Active</p>
                      <p className="text-sm font-medium text-white truncate">{getTimeSince(friendProfile.lastLogin || new Date())}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-8">
              {!isBlocked && (
                <>
                  {/* Only show Send Message button if they are friends */}
                  {relationshipStatus === 'friend' && (
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                      <MessageSquare size={16} />
                      <span>Send Message</span>
                    </button>
                  )}
                  
                  {/* Dynamic Relationship Button - only show if not blocked */}
                  <button 
                    onClick={relationshipButton.onClick}
                    disabled={relationshipButton.disabled}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${
                      actionLoading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : relationshipButton.bgClass
                    }`}
                  >
                    {actionLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Processing...</span>
                      </span>
                    ) : (
                      <>
                        {relationshipButton.icon}
                        <span>{relationshipButton.text}</span>
                      </>
                    )}
                  </button>
                  
                  {/* Show Decline Button when there's a received request */}
                  {relationshipStatus === 'received' && !actionLoading && (
                    <button 
                      onClick={handleDeclineRequest}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      <AlertTriangle size={16} />
                      <span>Decline Request</span>
                    </button>
                  )}
                </>
              )}
              
              {/* Block/Unblock User Button */}
              {isBlocked ? (
                <button 
                  onClick={handleUnblockUser}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors text-green-400 hover:text-green-300"
                >
                  {actionLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </span>
                  ) : (
                    <>
                      <Shield size={16} />
                      <span>Unblock User</span>
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => setShowBlockModal(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors text-red-400 hover:text-red-300"
                >
                  <ShieldAlert size={16} />
                  <span>Block User</span>
                </button>
              )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
              {/* Left Column (2/3 width on large screens) */}
              <div className="lg:col-span-2 space-y-8">
                {/* About Section */}
                <div className="bg-gray-750 rounded-xl overflow-hidden shadow-md">
                  <div className="border-b border-gray-700 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <User className="text-indigo-400" size={18} />
                      About
                    </h2>
                  </div>
                  <div className="p-6">
                    {friendProfile.bio ? (
                      <p className="text-gray-300 leading-relaxed">
                        {friendProfile.bio}
                      </p>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                        <p className="text-gray-400">No bio information available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills Section - Bubble Style */}
                <div className="bg-gray-750 rounded-xl overflow-hidden shadow-md">
                  <div className="border-b border-gray-700 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Code className="text-purple-400" size={18} />
                      Skills & Expertise
                    </h2>
                  </div>
                  
                  {friendProfile.skills && friendProfile.skills.length > 0 ? (
                    <div className="p-6">
                      <div className="flex flex-wrap gap-3 justify-center">
                        {friendProfile.skills.map((skill, index) => {
                          // Create a visually interesting but organized pattern
                          const categories = ['primary', 'secondary', 'accent', 'neutral'];
                          const category = categories[index % categories.length];
                          
                          // Different color schemes based on category
                          let colorClass = '';
                          switch (category) {
                            case 'primary':
                              colorClass = 'bg-indigo-600/80 hover:bg-indigo-500';
                              break;
                            case 'secondary':
                              colorClass = 'bg-purple-600/80 hover:bg-purple-500';
                              break;
                            case 'accent':
                              colorClass = 'bg-blue-600/80 hover:bg-blue-500';
                              break;
                            case 'neutral':
                              colorClass = 'bg-cyan-600/80 hover:bg-cyan-500';
                              break;
                            default:
                              colorClass = 'bg-gray-700/80 hover:bg-gray-600';
                          }
                          
                          return (
                            <div 
                              key={index}
                              className={`relative px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${colorClass} shadow-md`}
                            >
                              {skill}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                        <p className="text-gray-400">No skills listed yet</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Projects Section - Conditional */}
                {friendProfile.projects && friendProfile.projects.length > 0 && (
                  <div className="bg-gray-750 rounded-xl overflow-hidden shadow-md">
                    <div className="border-b border-gray-700 px-6 py-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Briefcase className="text-cyan-400" size={18} />
                        Projects
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {friendProfile.projects.map((project, index) => (
                          <div key={index} className="bg-gray-800/70 p-5 rounded-lg border border-gray-700/50">
                            <h3 className="font-semibold text-white text-lg mb-2">{project.name}</h3>
                            <p className="text-gray-300 text-sm mb-3">{project.description}</p>
                            {project.link && (
                              <a 
                                href={project.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-indigo-400 text-sm flex items-center gap-2 hover:text-indigo-300"
                              >
                                <ExternalLink size={14} />
                                <span>View Project</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (1/3 width on large screens) */}
              <div className="space-y-8">
                {/* Contact Information */}
                <div className="bg-gray-750 rounded-xl overflow-hidden shadow-md">
                  <div className="border-b border-gray-700 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Mail className="text-green-400" size={18} />
                      Contact Information
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Email - always show */}
                    <div className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-700/40">
                      <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400">
                        <Mail size={18} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-gray-400">Email</p>
                        {friendProfile.email ? (
                          <a
                            href={`mailto:${friendProfile.email}`}
                            className="text-gray-200 text-sm font-medium hover:text-indigo-400 hover:underline truncate block"
                          >
                            {friendProfile.email}
                          </a>
                        ) : (
                          <p className="text-gray-300 text-sm font-medium">Not available</p>
                        )}
                      </div>
                    </div>

                    {/* GitHub - conditional */}
                    {friendProfile.socialLinks?.github && (
                      <div className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-700/40">
                        <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400">
                          <Github size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs text-gray-400">GitHub</p>
                          <a
                            href={friendProfile.socialLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-200 text-sm font-medium hover:text-indigo-400 hover:underline truncate block"
                          >
                            {friendProfile.socialLinks.github.replace("https://", "")}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* LinkedIn - conditional */}
                    {friendProfile.socialLinks?.linkedin && (
                      <div className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-700/40">
                        <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400">
                          <Linkedin size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs text-gray-400">LinkedIn</p>
                          <a
                            href={friendProfile.socialLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-200 text-sm font-medium hover:text-indigo-400 hover:underline truncate block"
                          >
                            {friendProfile.socialLinks.linkedin.replace("https://", "")}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Show message if no social links */}
                    {(!friendProfile.socialLinks?.github && !friendProfile.socialLinks?.linkedin) && (
                      <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <p className="text-gray-400 text-sm">No social links available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account Information */}
                <div className="bg-gray-750 rounded-xl overflow-hidden shadow-md">
                  <div className="border-b border-gray-700 px-6 py-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Shield className="text-orange-400" size={18} />
                      Account Information
                    </h2>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between items-center p-3 hover:bg-gray-700/40 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Globe className="w-4 h-4" />
                        <span>Status</span>
                      </div>
                      <span className="font-medium text-sm" style={{ color: statusStyles.color }}>
                        {friendProfile.accountStatus || "Active"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 hover:bg-gray-700/40 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Last Updated</span>
                      </div>
                      <span className="font-medium text-white text-sm">
                        {formatDate(friendProfile.updatedAt || new Date())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location - Conditional */}
                {friendProfile.location && (
                  <div className="bg-gray-750 rounded-xl overflow-hidden shadow-md">
                    <div className="border-b border-gray-700 px-6 py-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <MapPin className="text-red-400" size={18} />
                        Location
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-800/70 p-4 rounded-lg flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{friendProfile.location}</p>
                          <p className="text-gray-400 text-sm">{friendProfile.timezone || "Timezone not set"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfilePage;