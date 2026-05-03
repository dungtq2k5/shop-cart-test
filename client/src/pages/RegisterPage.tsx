import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Package } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuthStore();
  const { fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ email, password });
      await fetchCart();
      toast.success('Account created! Welcome to ShopCart!');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-accent)] shadow-2xl shadow-indigo-500/40 mb-4">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Create account</h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-sm">Join ShopCart and start shopping</p>
        </div>

        <form
          id="register-form"
          onSubmit={handleSubmit}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl shadow-black/30 space-y-5"
        >
          <div>
            <label htmlFor="register-email" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
              Email address
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] text-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-sm font-medium text-[var(--color-text-muted)] mb-1.5">
              Password <span className="text-[var(--color-text-muted)] font-normal">(min. 8 chars)</span>
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] text-sm focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
              />
              <button
                type="button"
                id="register-toggle-password"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Password strength indicator */}
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    password.length >= level * 3
                      ? level <= 1 ? 'bg-red-500' : level <= 2 ? 'bg-amber-500' : level <= 3 ? 'bg-yellow-400' : 'bg-emerald-500'
                      : 'bg-[var(--color-border)]'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            id="register-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Already have an account?{' '}
            <Link to="/login" id="register-login-link" className="text-[var(--color-accent-light)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
