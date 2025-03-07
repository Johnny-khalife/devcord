import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, MessageSquare, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";
import { axiosInstance } from "../lib/axios";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = () => {
    if (!email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("Invalid email format");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateEmail() !== true) return;

    setIsSubmitting(true);
    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      setEmailSent(true);
      toast.success("Password reset link sent to your email");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send reset email. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
                group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Forgot Password</h1>
              <p className="text-base-content/60">
                {emailSent 
                  ? "Check your email for a reset link" 
                  : "Enter your email to receive a password reset link"}
              </p>
            </div>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-5 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          ) : (
            <div className="bg-success/10 p-6 rounded-lg text-center space-y-4">
              <p>We've sent a password reset link to <strong>{email}</strong></p>
              <p className="text-sm text-base-content/60">
                If you don't see it in your inbox, please check your spam folder.
              </p>
              <button 
                className="btn btn-outline mt-4"
                onClick={() => setEmailSent(false)}
              >
                Try a different email
              </button>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-primary">
              <ArrowLeft className="size-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* right side */}
      <AuthImagePattern
        title="Reset Your Password"
        subtitle="We'll help you get back into your account quickly and securely."
      />
    </div>
  );
};

export default ForgotPasswordPage;