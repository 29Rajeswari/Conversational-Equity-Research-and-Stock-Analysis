import { useState } from "react";
import Card from "../../ui/Card";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 🔗 API integration will be added later
    setTimeout(() => {
      setLoading(false);
      console.log("Login:", { email, password });
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md p-8">
        
        {/* TITLE */}
        <h2 className="text-2xl font-semibold text-white text-center">
          Welcome Back
        </h2>
        <p className="text-sm text-gray-400 text-center mt-2">
          Sign in to access financial insights
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

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {loading ? (
            <Loader text="Signing in..." />
          ) : (
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          )}
        </form>

        {/* FOOTER */}
        <p className="text-sm text-gray-400 text-center mt-6">
          Don’t have an account?{" "}
          <span className="text-blue-400 hover:underline cursor-pointer">
            Sign up
          </span>
        </p>
      </Card>
    </div>
  );
}
