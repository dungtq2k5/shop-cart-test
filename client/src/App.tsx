import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAuthStore } from "./stores/useAuthStore";
import { useCartStore } from "./stores/useCartStore";
import Navbar from "./components/Navbar";
import { AuthRoute, NotAuthRoute } from "./components/RouteGuards";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
import {
  TOAST_DURATION_MS,
  TOAST_ERROR_DURATION_MS,
  TOAST_STYLE,
  TOAST_SUCCESS_ICON_THEME,
  TOAST_ERROR_ICON_THEME,
} from "./config/constants";

function AppContent() {
  const { checkAuth, isAuth, isCheckingAuth } = useAuthStore();
  const { fetchCart } = useCartStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuth) fetchCart();
  }, [isAuth, fetchCart]);

  return (
    <>
      {isCheckingAuth ? (
        <div className="fixed inset-0 flex items-center justify-center bg-(--color-bg)">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-(--color-accent) flex items-center justify-center animate-pulse shadow-2xl shadow-indigo-500/40">
              <span className="text-white text-xl">🛍</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-(--color-accent) animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={
                <NotAuthRoute>
                  <LoginPage />
                </NotAuthRoute>
              }
            />
            <Route
              path="/register"
              element={
                <NotAuthRoute>
                  <RegisterPage />
                </NotAuthRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <AuthRoute>
                  <CartPage />
                </AuthRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <AuthRoute>
                  <CheckoutPage />
                </AuthRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthRoute>
                  <ProfilePage />
                </AuthRoute>
              }
            />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center text-center pt-16">
                  <div>
                    <div className="text-7xl mb-4">🔍</div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                      404
                    </h1>
                    <p className="text-(--color-text-muted)">Page not found</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: TOAST_DURATION_MS,
          style: TOAST_STYLE,
          success: { iconTheme: TOAST_SUCCESS_ICON_THEME },
          error: {
            iconTheme: TOAST_ERROR_ICON_THEME,
            duration: TOAST_ERROR_DURATION_MS,
          },
        }}
      />
    </BrowserRouter>
  );
}
