import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import type { ReactNode } from "react";
import { memo } from "react";

const AuthRoute = memo(({ children }: Readonly<{ children: ReactNode }>) => {
  const { isAuth, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return null; // handled by App-level loading gate

  if (!isAuth) return <Navigate to="/login" replace />;

  return <>{children}</>;
});

const NotAuthRoute = memo(({ children }: Readonly<{ children: ReactNode }>) => {
  const { isAuth, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return null;

  if (isAuth) return <Navigate to="/" replace />;

  return <>{children}</>;
});

export { AuthRoute, NotAuthRoute };
