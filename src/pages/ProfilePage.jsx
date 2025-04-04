import { useEffect, useState } from "react";
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
  const [skillsInput, setSkillsInput] = useState("");

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

  useEffect(() => {
    if (isEditingSkills) {
      setSkillsInput(skills.join(", "));
    }
  }, [isEditingSkills, skills]);

  return (
    <div className="min-h-screen pt-20 bg-base-300 text-gray-100">
      <div className="max-w-2xl mx-auto p-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <p className="mt-2 text-gray-400">Manage your personal information</p>
        </div>

        {/* Main Profile Card */}
        <div className="bg-base-100 rounded-xl p-6 space-y-8 shadow-2xl border border-gray-700">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <img
                src={selectedImg || authUser.avatar || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4 border-gray-700 group-hover:border-indigo-500 transition-colors"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-indigo-600 hover:bg-indigo-700
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200 shadow-lg
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
            <p className="text-sm text-gray-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

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
                  />
                  <button
                    onClick={handleNameUpdate}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                    disabled={isUpdatingProfile}
                  >
                    <Check />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                  >
                    <X />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow">
                    {authUser?.username}
                  </p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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
                <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow opacity-80">
                  {authUser?.email}
                </p>
                <Eye className="ml-4 opacity-60" />
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
                  />
                  <button
                    onClick={handleGithubUpdate}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                    disabled={isUpdatingProfile}
                  >
                    <Check />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingGithub(false);
                      setgithub(github || "");
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                  >
                    <X />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow">
                    {github || "No GitHub URL added"}
                  </p>
                  <button
                    onClick={() => setIsEditingGithub(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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
                  />
                  <button
                    onClick={handleLinkedinUpdate}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                    disabled={isUpdatingProfile}
                  >
                    <Check />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingLinkedin(false);
                      setlinkedin(authUser?.socialLinks?.linkedin || "");
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                  >
                    <X />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow">
                    {authUser?.socialLinks?.linkedin || "No LinkedIn URL added"}
                  </p>
                  <button
                    onClick={() => setIsEditingLinkedin(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleBioUpdate}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                      disabled={isUpdatingProfile}
                    >
                      <Check />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBio(authUser?.bio || "");
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                    >
                      <X />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow min-h-24">
                    {authUser?.bio || "No bio added"}
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>

            {/* Skills Field */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Skills
              </label>
              {isEditingSkills ? (
                <div className="flex gap-2">
                  <textarea
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="JavaScript, React, Node.js (separate with commas)"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        const processedSkills = skillsInput
                          .split(",")
                          .map((skill) => skill.trim())
                          .filter((skill) => skill.length > 0);
                        setSkills(processedSkills);
                        handleSkillsUpdate(processedSkills);
                      }}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                      disabled={isUpdatingProfile}
                    >
                      <Check />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingSkills(false);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
                    >
                      <X />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 flex-grow">
                    {skills && skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-indigo-900/50 px-3 py-1 rounded-full text-sm text-indigo-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "No skills added"
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditingSkills(true)}
                    className="ml-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="mt-8 bg-gray-700/50 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-medium mb-4 text-white">Account Information</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-600">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>Member Since</span>
                </div>
                <span className="text-gray-100">{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-600">
                <div className="flex items-center gap-2 text-gray-300">
                  <Shield className="w-4 h-4" />
                  <span>Account Status</span>
                </div>
                <span className="text-green-400">Active</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <Key className="w-4 h-4" />
                  <span>Last Updated</span>
                </div>
                <span className="text-gray-100">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;