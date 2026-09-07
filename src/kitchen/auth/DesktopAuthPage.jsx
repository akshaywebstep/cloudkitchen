import React from "react";
import { useLocation } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { ResetPasswordPage } from "./ResetPasswordPage";

export { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage };

export function DesktopAuthPage({ onLogin, onToast }) {
  const location = useLocation();

  if (location.pathname === "/register") {
    return <RegisterPage onToast={onToast} />;
  }

  if (location.pathname === "/forgot-password") {
    return <ForgotPasswordPage onToast={onToast} />;
  }

  if (location.pathname === "/reset-password") {
    return <ResetPasswordPage onToast={onToast} />;
  }

  return <LoginPage onLogin={onLogin} onToast={onToast} />;
}
