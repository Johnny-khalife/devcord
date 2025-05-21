import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Camera,
  Mail,
  User,
  Edit2,
  Code,
  FileText,
  Github,
  Linkedin,
  X,
  Check,
  Eye,
  Calendar,
  Shield,
  Key,
  Globe,
  Plus,
  Star,
  Tag,
  Trash2,
  AlertCircle
} from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, updateAvatar } =
    useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingGithub, setIsEditingGithub] = useState(false);
  const [isEditingLinkedin, setIsEditingLinkedin] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [username, setUsername] = useState(authUser?.username || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [skills, setSkills] = useState(
    Array.isArray(authUser?.skills) ? authUser?.skills : []
  );
  const [github, setgithub] = useState(authUser?.socialLinks?.github || "");
  const [linkedin, setlinkedin] = useState(
    authUser?.socialLinks?.linkedin || ""
  );
  
  // New state variables for enhanced skills section
  const [currentSkill, setCurrentSkill] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Modern alert states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const confirmDialogRef = useRef(null);
  
  // Popular skill suggestions for developers
  const popularSkills = [
    "JavaScript", "TypeScript", "React", "Vue", "Angular", 
    "Node.js", "Express", "MongoDB", "PostgreSQL", "SQL",
    "HTML", "CSS", "Tailwind CSS", "Next.js", "GraphQL",
    "Python", "Java", "C#", "Ruby", "PHP", "Go", "Rust",
    "AWS", "Firebase", "Docker", "Kubernetes", "Git"
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateAvatar({ avatar: base64Image });
    };
  };

  const handleNameUpdate = async () => {
    if (username.trim() === authUser?.username) {
      setIsEditingName(false);
      return;
    }
    await updateProfile({ username: username.trim() });
    setIsEditingName(false);
  };

  const handleGithubUpdate = async () => {
    if (github.trim() === authUser?.github) {
      setIsEditingGithub(false);
      return;
    }
    await updateProfile({ github: github.trim() });
    setIsEditingGithub(false);
  };

  const handleLinkedinUpdate = async () => {
    if (linkedin.trim() === authUser?.linkedin) {
      setIsEditingLinkedin(false);
      return;
    }
    await updateProfile({ linkedin: linkedin.trim() });
    setIsEditingLinkedin(false);
  };

  const handleBioUpdate = async () => {
    if (bio.trim() === authUser?.bio) {
      setIsEditingBio(false);
      return;
    }
    await updateProfile({ bio: bio.trim() });
    setIsEditingBio(false);
  };

  const handleSkillsUpdate = async (processedSkills = skills) => {
    const currentSkills = processedSkills;
    const userSkills = Array.isArray(authUser?.skills) ? authUser?.skills : [];
    const areEqual =
      currentSkills.length === userSkills.length &&
      currentSkills.every((skill, index) => skill === userSkills[index]);

    if (areEqual) {
      setIsEditingSkills(false);
      return;
    }
    await updateProfile({ skills: currentSkills });
    setIsEditingSkills(false);
  };
  
  // Function to add a new skill
  const addSkill = (skillToAdd) => {
    if (!skillToAdd.trim()) return;
    
    // Check if skill already exists
    if (skills.some(skill => skill.toLowerCase() === skillToAdd.trim().toLowerCase())) {
      return;
    }
    
    const newSkills = [...skills, skillToAdd.trim()];
    setSkills(newSkills);
    setCurrentSkill("");
    setShowSuggestions(false);
  };
  
  // Function to remove a skill
  const removeSkill = (indexToRemove) => {
    const newSkills = skills.filter((_, index) => index !== indexToRemove);
    setSkills(newSkills);
  };
  
  // Function to filter skill suggestions based on input
  const filterSuggestions = (input) => {
    if (!input.trim()) {
      setSkillSuggestions([]);
      return;
    }
    
    const filtered = popularSkills.filter(skill => 
      skill.toLowerCase().includes(input.toLowerCase()) && 
      !skills.some(existing => existing.toLowerCase() === skill.toLowerCase())
    );
    
    setSkillSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
    setShowSuggestions(filtered.length > 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    // No longer need to set skillsInput value
  }, [isEditingSkills, skills]);
  
  // Update suggestions when currentSkill changes
  useEffect(() => {
    filterSuggestions(currentSkill);
  }, [currentSkill, skills]);

  // Function to handle click outside the confirm dialog
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (confirmDialogRef.current && !confirmDialogRef.current.contains(event.target)) {
        setShowConfirmDialog(false);
      }
    };

    if (showConfirmDialog) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showConfirmDialog]);

  // Function to reset avatar to default
  const handleResetAvatar = async () => {
    setShowConfirmDialog(true);
  };
  
  // Function to confirm avatar reset
  const confirmResetAvatar = async () => {
    try {
      // First reset the UI state immediately
      setSelectedImg(null);
      setShowConfirmDialog(false);
      
      // We need to ensure the avatar image is refreshed to avoid caching issues
      const defaultAvatarWithTimestamp = "/avatar.png?t=" + new Date().getTime();
      const profileImg = document.querySelector("img[alt='Profile']");
      if (profileImg) {
        profileImg.src = defaultAvatarWithTimestamp;
      }
      
      // Then call the API to reset server-side
      await updateAvatar({ avatar: "" });
      
      // Manually update the authUser object to ensure consistency
      if (authUser) {
        const updatedUser = { ...authUser, avatar: null };
        useAuthStore.setState({ authUser: updatedUser });
      }
    } catch (error) {
      
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-base-300 to-gray-900 text-gray-100">
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div 
            ref={confirmDialogRef}
            className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-5 max-w-sm w-full mx-4 transform transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-indigo-400 w-6 h-6" />
              <h3 className="text-lg font-semibold text-white">Reset Avatar</h3>
            </div>
            <p className="text-gray-300 mb-5">
              Are you sure you want to reset your avatar to the default? 
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmResetAvatar}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-white transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-2xl mx-auto p-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="mt-2 text-gray-400">Manage your personal information</p>
        </div>

        {/* Main Profile Card */}
        <div className="bg-base-100 rounded-xl p-6 space-y-8 shadow-2xl border border-gray-700 relative overflow-hidden">
          {/* Decorative element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <img
                src={selectedImg || authUser.avatar || "/avatar.png"}
                alt="Profile"
                className="w-36 h-36 rounded-full object-cover border-4 border-gray-700 group-hover:border-indigo-500 group-hover:shadow-lg group-hover:shadow-indigo-500/25 transition-all"
              />
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Camera upload button */}
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-2 right-2 
                  bg-indigo-600 hover:bg-indigo-700
                  p-2.5 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-lg
                  z-10 transform scale-90 hover:scale-100
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5 text-white" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">
                {isUpdatingProfile
                  ? "Updating avatar..."
                  : "Click the camera icon to update your photo"}
              </p>
              {(selectedImg || authUser.avatar) && (
                <button 
                  onClick={handleResetAvatar}
                  disabled={isUpdatingProfile}
                  className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 transition-colors font-medium"
                >
                  Reset to default avatar
                </button>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-4"></div>

          {/* Profile Fields */}
          <div className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </label>
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={handleNameUpdate}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors flex items-center"
                    disabled={isUpdatingProfile}
                    title="Save changes"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-xs">Save</span>
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-white transition-colors flex items-center"
                    title="Cancel changes"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <span className="text-xs">Cancel</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow">
                    {authUser?.username}
                  </p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors hover:text-indigo-300"
                  >
                    <Edit2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="flex items-center justify-between">
                <p className="px-4 py-2.5 bg-gray-700/50 rounded-lg border border-gray-700 flex-grow text-gray-300">
                  {authUser?.email}
                  <span className="ml-2 text-xs text-gray-500 italic">Read-only</span>
                </p>
                <div className="ml-2 p-2 bg-gray-700/50 rounded-lg text-gray-500">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* GitHub Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub URL
              </label>
              {isEditingGithub ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setgithub(e.target.value)}
                    className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://github.com/yourusername"
                    autoFocus
                  />
                  <button
                    onClick={handleGithubUpdate}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors flex items-center"
                    disabled={isUpdatingProfile}
                    title="Save changes"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-xs">Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingGithub(false);
                      setgithub(github || "");
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-white transition-colors flex items-center"
                    title="Cancel changes"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <span className="text-xs">Cancel</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow">
                    {github ? (
                      <a 
                        href={github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-300 hover:underline flex items-center"
                      >
                        {github}
                      </a>
                    ) : (
                      <span className="text-gray-400">No GitHub URL added</span>
                    )}
                  </p>
                  <button
                    onClick={() => setIsEditingGithub(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors hover:text-indigo-300"
                  >
                    <Edit2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>

            {/* LinkedIn Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn URL
              </label>
              {isEditingLinkedin ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setlinkedin(e.target.value)}
                    className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://linkedin.com/in/yourprofile"
                    autoFocus
                  />
                  <button
                    onClick={handleLinkedinUpdate}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors flex items-center"
                    disabled={isUpdatingProfile}
                    title="Save changes"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    <span className="text-xs">Save</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingLinkedin(false);
                      setlinkedin(authUser?.socialLinks?.linkedin || "");
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-white transition-colors flex items-center"
                    title="Cancel changes"
                  >
                    <X className="w-4 h-4 mr-1" />
                    <span className="text-xs">Cancel</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow">
                    {authUser?.socialLinks?.linkedin ? (
                      <a 
                        href={authUser.socialLinks.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-indigo-300 hover:underline flex items-center"
                      >
                        {authUser.socialLinks.linkedin}
                      </a>
                    ) : (
                      <span className="text-gray-400">No LinkedIn URL added</span>
                    )}
                  </p>
                  <button
                    onClick={() => setIsEditingLinkedin(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors hover:text-indigo-300"
                  >
                    <Edit2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>

            {/* Bio Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </label>
              {isEditingBio ? (
                <div className="flex gap-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow min-h-24 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Tell us about yourself..."
                    autoFocus
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleBioUpdate}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors flex items-center"
                      disabled={isUpdatingProfile}
                      title="Save changes"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      <span className="text-xs">Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBio(authUser?.bio || "");
                      }}
                      className="px-3 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-white transition-colors flex items-center"
                      title="Cancel changes"
                    >
                      <X className="w-4 h-4 mr-1" />
                      <span className="text-xs">Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 flex-grow min-h-24 leading-relaxed whitespace-pre-line">
                    {authUser?.bio ? 
                      authUser.bio : 
                      <span className="text-gray-400">No bio added. Tell others about yourself, your interests, and your experience.</span>
                    }
                  </div>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors hover:text-indigo-300"
                  >
                    <Edit2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>

            {/* Skills Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-400 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Skills
                </label>
                <span className="text-xs text-gray-500">
                  {skills.length} / 20 skills added
                </span>
              </div>
              
              {isEditingSkills ? (
                <div className="p-1">
                  <p className="text-xs text-gray-400 mb-3">
                    Add skills that showcase your expertise. Well-documented skills help you connect with like-minded developers.
                  </p>
                  
                  {/* Current skills display with remove buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {skills.map((skill, index) => (
                      <div
                        key={index}
                        className="bg-indigo-900/70 px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-1.5 group"
                      >
                        <Tag className="w-3 h-3 text-indigo-300" />
                        <span>{skill}</span>
                        <button
                          onClick={() => removeSkill(index)}
                          className="text-indigo-300 hover:text-white ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
                          title="Remove skill"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* New skill input */}
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <input
                          type="text"
                          value={currentSkill}
                          onChange={(e) => setCurrentSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && currentSkill.trim()) {
                              e.preventDefault();
                              addSkill(currentSkill);
                            }
                          }}
                          className="px-4 py-2.5 bg-gray-800 rounded-lg border border-gray-600 w-full text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Type a skill and press Enter"
                        />
                        {showSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg border border-gray-600 shadow-lg z-10">
                            {skillSuggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-200 flex items-center gap-2"
                                onClick={() => addSkill(suggestion)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => addSkill(currentSkill)}
                        disabled={!currentSkill.trim()}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                        title="Add skill"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-400">
                      Press Enter to add a skill or select from suggestions
                    </p>
                  </div>
                  
                  {/* Popular skills suggestions */}
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                      <Star className="w-3 h-3 text-yellow-400" />
                      Popular skills:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {popularSkills.slice(0, 12).map((skill, index) => (
                        skills.some(s => s.toLowerCase() === skill.toLowerCase()) ? null : (
                          <button
                            key={index}
                            onClick={() => addSkill(skill)}
                            className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            {skill}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                  
                  {/* Action button - only save */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => handleSkillsUpdate(skills)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors flex items-center"
                      disabled={isUpdatingProfile}
                      title="Save changes"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      <span>Save Skills</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    {skills && skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => {
                          // Apply different colors based on position for visual variety
                          const colorClasses = [
                            "from-indigo-800 to-purple-900",
                            "from-blue-800 to-indigo-900",
                            "from-cyan-800 to-blue-900",
                            "from-purple-800 to-pink-900",
                            "from-violet-800 to-purple-900"
                          ];
                          const colorClass = colorClasses[index % colorClasses.length];
                          
                          return (
                            <span
                              key={index}
                              className={`bg-gradient-to-r ${colorClass} px-3 py-1.5 rounded-lg text-sm text-white shadow-sm hover:shadow-md transition-all flex items-center gap-1.5`}
                            >
                              <Tag className="w-3 h-3 opacity-70" />
                              {skill}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6 text-center">
                        <Code className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-gray-400">No skills added yet</span>
                        <span className="text-gray-500 text-sm mt-1">Add your technical skills to highlight your expertise</span>
                        <button
                          onClick={() => setIsEditingSkills(true)}
                          className="mt-3 px-3 py-1.5 bg-indigo-600/70 hover:bg-indigo-600 rounded-md text-sm text-white transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Skills
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditingSkills(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors hover:text-indigo-300"
                  >
                    <Edit2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-4"></div>

          {/* Account Information */}
          <div className="mt-8 bg-gray-800/70 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
            <h2 className="text-lg font-medium mb-4 text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-600/70 hover:bg-gray-700/30 px-2 rounded transition-colors">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-indigo-300" />
                  <span>Member Since</span>
                </div>
                <span className="text-gray-100">{formatDate(authUser.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-600/70 hover:bg-gray-700/30 px-2 rounded transition-colors">
                <div className="flex items-center gap-2 text-gray-300">
                  <Shield className="w-4 h-4 text-green-300" />
                  <span>Account Status</span>
                </div>
                <span className="text-green-400 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between py-2 hover:bg-gray-700/30 px-2 rounded transition-colors">
                <div className="flex items-center gap-2 text-gray-300">
                  <Key className="w-4 h-4 text-yellow-300" />
                  <span>Last Updated</span>
                </div>
                <span className="text-gray-100">{formatDate(new Date())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;