import { useState } from "react";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    // 🔗 Backend integration later
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md p-8">

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-white text-center">
          Reset Password
        </h2>
        <p className="text-sm text-gray-400 text-center mt-2">
          Enter your new password
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          {loading ? (
            <Loader text="Resetting password..." />
          ) : (
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          )}
        </form>

        {/* SUCCESS MESSAGE */}
        {success && (
          <p className="text-sm text-green-400 text-center mt-4">
            Password reset successfully. You can now log in.
          </p>
        )}
      </Card>
    </div>
  );
}
