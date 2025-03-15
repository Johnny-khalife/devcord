// import { useState } from "react";
// import { useAuthStore } from "../store/useAuthStore";
// import { Camera, Mail, User } from "lucide-react";

// const ProfilePage = () => {
//   const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
//   const [selectedImg, setSelectedImg] = useState(null);

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const reader = new FileReader();

//     reader.readAsDataURL(file);

//     reader.onload = async () => {
//       const base64Image = reader.result;
//       setSelectedImg(base64Image);
//       await updateProfile({ profilePic: base64Image });
//     };
//   };

//   return (
//     <div className="h-screen pt-20">
//       <div className="max-w-2xl mx-auto p-4 py-8">
//         <div className="bg-base-300 rounded-xl p-6 space-y-8">
//           <div className="text-center">
//             <h1 className="text-2xl font-semibold ">Profile</h1>
//             <p className="mt-2">Your profile information</p>
//           </div>

//           {/* avatar upload section */}

//           <div className="flex flex-col items-center gap-4">
//             <div className="relative">
//               <img
//                 src={selectedImg || authUser.profilePic || "/avatar.png"}
//                 alt="Profile"
//                 className="size-32 rounded-full object-cover border-4 "
//               />
//               <label
//                 htmlFor="avatar-upload"
//                 className={`
//                   absolute bottom-0 right-0
//                   bg-base-content hover:scale-105
//                   p-2 rounded-full cursor-pointer
//                   transition-all duration-200
//                   ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
//                 `}
//               >
//                 <Camera className="w-5 h-5 text-base-200" />
//                 <input
//                   type="file"
//                   id="avatar-upload"
//                   className="hidden"
//                   accept="image/*"
//                   onChange={handleImageUpload}
//                   disabled={isUpdatingProfile}
//                 />
//               </label>
//             </div>
//             <p className="text-sm text-zinc-400">
//               {isUpdatingProfile ? "Uploading..." : "Click the camera icon to update your photo"}
//             </p>
//           </div>

//           <div className="space-y-6">
//             <div className="space-y-1.5">
//               <div className="text-sm text-zinc-400 flex items-center gap-2">
//                 <User className="w-4 h-4" />
//                 Full Name
//               </div>
//               <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.username}</p>
//             </div>

//             <div className="space-y-1.5">
//               <div className="text-sm text-zinc-400 flex items-center gap-2">
//                 <Mail className="w-4 h-4" />
//                 Email Address
//               </div>
//               <p className="px-4 py-2.5 bg-base-200 rounded-lg border">{authUser?.email}</p>
//             </div>
//           </div>

//           <div className="mt-6 bg-base-300 rounded-xl p-6">
//             <h2 className="text-lg font-medium  mb-4">Account Information</h2>
//             <div className="space-y-3 text-sm">
//               <div className="flex items-center justify-between py-2 border-b border-zinc-700">
//                 <span>Member Since</span>
//                 <span>{authUser.createdAt?.split("T")[0]}</span>
//               </div>
//               <div className="flex items-center justify-between py-2">
//                 <span>Account Status</span>
//                 <span className="text-green-500">Active</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// export default ProfilePage;

import { useState } from "react";
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
  Eye
} from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingGithub, setIsEditingGithub] = useState(false);
  const [isEditingLinkedin, setIsEditingLinkedin] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [username, setUsername] = useState(authUser?.username || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [skills, setSkills] = useState(authUser?.skills || "");
  const [github, setgithub] = useState(authUser?.socialLinks?.github || "");
  const [linkedin, setlinkedin] = useState(
    authUser?.socialLinks?.linkedin || ""
  );

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
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

  const handleSkillsUpdate = async () => {
    if (skills.trim() === authUser?.skills) {
      setIsEditingSkills(false);
      return;
    }

    await updateProfile({ skills: skills.trim() });
    setIsEditingSkills(false);
  };

  return (
    <div className="h-screen pt-20">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-base-300 rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold">Profile</h1>
            <p className="mt-2">Your profile information</p>
          </div>
          {/* avatar upload section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={selectedImg || authUser.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover border-4"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-base-content hover:scale-105
                  p-2 rounded-full cursor-pointer 
                  transition-all duration-200
                  ${
                    isUpdatingProfile ? "animate-pulse pointer-events-none" : ""
                  }
                `}
              >
                <Camera className="w-5 h-5 text-base-200" />
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
            <p className="text-sm text-zinc-400">
              {isUpdatingProfile
                ? "Uploading..."
                : "Click the camera icon to update your photo"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </div>
              {isEditingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow"
                  />
                  <button
                    onClick={handleNameUpdate}
                    className="px-4 py-2  text-white"
                    disabled={isUpdatingProfile}
                  >
                    <Check/>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingName(false);
                    }}
                    className="px-4 py-2 rounded-lg text-white"
                  >
                    <X/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow">
                    {authUser?.username}
                  </p>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="ml-2 p-2 bg-base-200 rounded-lg hover:bg-base-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
             <div className=" flex items-center justify-between">
             <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow opacity-60">
                {authUser?.email}
              </p>
              <Eye className="ml-4 opacity-60"/>
             </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub URL
              </div>
              {isEditingGithub ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={github} // ✅ Use the useState variable
                    onChange={(e) => setgithub(e.target.value)}
                    className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow"
                    placeholder="https://github.com/yourusername"
                  />
                  <button
                    onClick={handleGithubUpdate}
                    className="px-4 py-2 rounded-lg text-white"
                    disabled={isUpdatingProfile}
                  >
                    <Check/>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingGithub(false);
                      setgithub(github || "");
                    }}
                    className="px-4 py-2 rounded-lg text-white"
                  >
                    <X/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow">
                    {github || "No GitHub URL added"}
                  </p>
                  <button
                    onClick={() => setIsEditingGithub(true)}
                    className="ml-2 p-2 bg-base-200 rounded-lg hover:bg-base-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn URL
              </div>
              {isEditingLinkedin ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkedin}
                    onChange={(e) => setlinkedin(e.target.value)}
                    className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  <button
                    onClick={handleLinkedinUpdate}
                    className="px-4 py-2 rounded-lg text-white"
                    disabled={isUpdatingProfile}
                  >
                    <Check/>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingLinkedin(false);
                      setlinkedin(authUser?.socialLinks?.linkedin || "");
                    }}
                    className="px-4 py-2 rounded-lg text-white"
                  >
                    <X/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow">
                    {authUser?.socialLinks?.linkedin || "No LinkedIn URL added"}
                  </p>
                  <button
                    onClick={() => setIsEditingLinkedin(true)}
                    className="ml-2 p-2 bg-base-200 rounded-lg hover:bg-base-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio
              </div>
              {isEditingBio ? (
                <div className="flex gap-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow min-h-24"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleBioUpdate}
                      className="px-4 py-2 rounded-lg text-white"
                      disabled={isUpdatingProfile}
                    >
                      <Check/>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingBio(false);
                        setBio(authUser?.bio || "");
                      }}
                      className="px-4 py-2 rounded-lg text-white"
                    >
                      <X/>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow min-h-24">
                    {authUser?.bio || "No bio added"}
                  </p>
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="ml-2 p-2 bg-base-200 rounded-lg hover:bg-base-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-zinc-400 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Skills
              </div>
              {isEditingSkills ? (
                <div className="flex gap-2">
                  <textarea
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow"
                    placeholder="List your skills (e.g., JavaScript, React, Node.js)"
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleSkillsUpdate}
                      className="px-4 py-2 rounded-lg text-white"
                      disabled={isUpdatingProfile}
                    >
                      <Check/>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingSkills(false);
                      }}
                      className="px-4 py-2 rounded-lg text-white"
                    >
                      <X/>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="px-4 py-2.5 bg-base-200 rounded-lg border flex-grow">
                    {authUser?.skills || "No skills added"}
                  </p>
                  <button
                    onClick={() => setIsEditingSkills(true)}
                    className="ml-2 p-2 bg-base-200 rounded-lg hover:bg-base-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 bg-base-300 rounded-xl p-6">
            <h2 className="text-lg font-medium mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-zinc-700">
                <span>Member Since</span>
                <span>{authUser.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
