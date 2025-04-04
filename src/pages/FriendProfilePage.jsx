import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  Mail,
  Code,
  FileText,
  Github,
  Linkedin,
  ArrowLeft,
  Calendar,
  User,
  Award,
  Globe,
  Shield,
} from "lucide-react";

const FriendProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUserById } = useAuthStore();
  const [friendProfile, setFriendProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFriendProfile = async () => {
      try {
        const profile = await getUserById(id);
        setFriendProfile(profile);
      } catch (error) {
        console.error("Error fetching friend profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendProfile();
  }, [id, getUserById]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-900 flex items-center justify-center">
        <div className="max-w-4xl w-full p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-800 rounded-full w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-64 bg-gray-800 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!friendProfile) {
    return (
      <div className="min-h-screen pt-20 bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800 rounded-2xl shadow-lg max-w-md mx-auto border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">
            The profile you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={18} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gray-900 text-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-8 group"
        >
          <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors shadow-sm">
            <ArrowLeft size={20} className="text-gray-400 group-hover:text-white" />
          </div>
          <span className="font-medium">Back</span>
        </button>

        {/* Profile Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700">
          {/* Cover Image and Avatar */}
          <div className="relative">
            <div className="h-24 bg-gray-750"></div>
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-full ring-4 ring-gray-800 overflow-hidden shadow-lg">
                <img
                  src={friendProfile.avatar || "/avatar.png"}
                  alt={`${friendProfile.username}'s avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Profile Header */}
          <div className="pt-20 px-8 pb-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">{friendProfile.username}</h1>
              <p className="text-gray-400 font-medium flex items-center gap-2 mt-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {friendProfile.status || "Online"}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-600 rounded-lg">
                    <User className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="font-semibold text-white">
                      {new Date(friendProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-600 rounded-lg">
                    <Award className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Skills</p>
                    <p className="font-semibold text-white">
                      {friendProfile.skills?.length || 0} listed
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-600 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Last Active</p>
                    <p className="font-semibold text-white">Today</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-600 rounded-lg">
                    <Globe className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className="font-semibold text-white">Available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Bio Section */}
              {friendProfile.bio && (
                <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 shadow-sm">
                  <h2 className="text-xl font-semibold text-white mb-4">About Me</h2>
                  <p className="text-gray-300 leading-relaxed">{friendProfile.bio}</p>
                </div>
              )}

              {/* Skills Section */}
              {friendProfile.skills && friendProfile.skills.length > 0 && (
                <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 shadow-sm">
                  <h2 className="text-xl font-semibold text-white mb-4">Skills & Expertise</h2>
                  <div className="flex flex-wrap gap-3">
                    {friendProfile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-gray-600 text-gray-200 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Contact Info */}
            <div className="space-y-6">
              <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 shadow-sm">
                <h2 className="text-xl font-semibold text-white mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-600 rounded-lg mt-0.5">
                      <Mail className="w-5 h-5 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <a
                        href={`mailto:${friendProfile.email}`}
                        className="text-gray-200 font-medium hover:underline"
                      >
                        {friendProfile.email}
                      </a>
                    </div>
                  </div>

                  {friendProfile.socialLinks?.github && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-600 rounded-lg mt-0.5">
                        <Github className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">GitHub</p>
                        <a
                          href={friendProfile.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-200 font-medium hover:underline"
                        >
                          {friendProfile.socialLinks.github.replace("https://", "")}
                        </a>
                      </div>
                    </div>
                  )}

                  {friendProfile.socialLinks?.linkedin && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-600 rounded-lg mt-0.5">
                        <Linkedin className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">LinkedIn</p>
                        <a
                          href={friendProfile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-200 font-medium hover:underline"
                        >
                          {friendProfile.socialLinks.linkedin.replace("https://", "")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 shadow-sm">
                <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-600">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="w-4 h-4" />
                      <span>Account Type</span>
                    </div>
                    <span className="font-medium text-white">Standard</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-600">
                    <div className="flex items-center gap-2 text-gray-400">
                      <User className="w-4 h-4" />
                      <span>Verification</span>
                    </div>
                    <span className="font-medium text-green-400">Verified</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Last Updated</span>
                    </div>
                    <span className="font-medium text-white">
                      {new Date().toLocaleDateString()}
                    </span>
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

export default FriendProfilePage;