import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";
import { Eye, EyeOff, Package } from "lucide-react";
import { formatError } from "../utils";

export default function LoginPage() {
  const { login } = useAuthStore();
  const { fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      await fetchCart();
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: unknown) {
      toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-(--color-accent) shadow-2xl shadow-indigo-500/40 mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Welcome back</h1>
          <p className="text-(--color-text-muted) mt-2 text-sm">
            Sign in to your ShopCart account
          </p>
        </div>

        <form
          id="login-form"
          onSubmit={handleSubmit}
          className="bg-(--color-surface) border border-(--color-border) rounded-2xl p-8 shadow-2xl shadow-black/30 space-y-5"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-(--color-text-muted) mb-1.5"
            >
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-(--color-text-muted) mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent)/20 transition-all"
              />
              <button
                type="button"
                id="login-toggle-password"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) hover:text-(--color-text) transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Demo hint */}
          <div className="rounded-lg bg-(--color-surface-2) border border-(--color-border) p-3 text-xs text-(--color-text-muted)">
            <strong className="text-(--color-accent-light)">Demo:</strong>{" "}
            test1@example.com / password123
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-(--color-text-muted)">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              id="login-register-link"
              className="text-(--color-accent-light) hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
