import { useState } from "react";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🔗 API integration later
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md p-8">

        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-white text-center">
          Forgot Password
        </h2>
        <p className="text-sm text-gray-400 text-center mt-2">
          Enter your email to receive a reset link
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {loading ? (
            <Loader text="Sending reset link..." />
          ) : (
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          )}
        </form>

        {/* SUCCESS MESSAGE */}
        {sent && (
          <p className="text-sm text-green-400 text-center mt-4">
            Reset link sent successfully.
          </p>
        )}
      </Card>
    </div>
  );
}
