import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Search,
  LogOut,
  Package,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../stores/useAuthStore";
import { useCartStore } from "../stores/useCartStore";
import { formatError } from "../utils";
import toast from "react-hot-toast";
import React, { useState, useRef, useEffect, memo } from "react";

const Navbar = memo(() => {
  const { isAuth, user, logout } = useAuthStore();
  const { cartItems } = useCartStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("name") || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch: React.SubmitEventHandler<HTMLFormElement> = (e): void => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("name", query.trim());
    navigate(`/?${params.toString()}`);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error(formatError(err, "Logout failed"));
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-(--color-border)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-(--color-accent) flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text hidden sm:block">
            ShopCart
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
            <input
              id="navbar-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-(--color-surface-2) border border-(--color-border) text-(--color-text) placeholder-(--color-text-muted) text-sm focus:border-(--color-accent) focus:ring-1 focus:ring-(--color-accent)/50 transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          {/* Cart */}
          {isAuth && (
            <Link
              to="/cart"
              id="navbar-cart-link"
              className="relative p-2 rounded-lg hover:bg-(--color-surface-2) transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5 text-(--color-text-muted) hover:text-(--color-text) transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-(--color-accent) text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth area */}
          {isAuth ? (
            <div className="relative" ref={dropdownRef}>
              <button
                id="navbar-user-menu"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-(--color-surface-2) transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.email[0].toUpperCase()}
                </div>
                <span className="text-sm text-(--color-text-muted) hidden md:block max-w-[120px] truncate">
                  {user?.email}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-(--color-text-muted) transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-(--color-surface) border border-(--color-border) shadow-xl shadow-black/40 overflow-hidden z-50">
                  <Link
                    to="/profile"
                    id="navbar-profile-link"
                    className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-(--color-surface-2) transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="w-4 h-4 text-(--color-text-muted)" />
                    My Profile
                  </Link>
                  <button
                    id="navbar-logout-btn"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                id="navbar-login-link"
                className="px-4 py-2 text-sm rounded-lg border border-(--color-border) hover:border-(--color-accent) text-(--color-text-muted) hover:text-(--color-text) transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                id="navbar-register-link"
                className="px-4 py-2 text-sm rounded-lg bg-(--color-accent) hover:bg-(--color-accent-hover) text-white font-medium transition-colors shadow-lg shadow-indigo-500/25"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
});

export default Navbar;
