import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  MobileSplash,
  MobileOnboard,
  MobileLogin,
  MobileSignup,
  MobileForgot,
  MobileVerify,
  MobileLocation,
  MobileHome,
  MobileDetail,
  MobileFilter,
  MobileCart,
  MobilePayment,
  MobileSuccess,
  MobileTrack,
  MobileChat,
  MobileProfile,
} from "./MobileScreens";

export function MobileApp({ apiState, onLogin, onLogout }) {
  const [cartCount, setCartCount] = useState(2);
  const [verifyContext, setVerifyContext] = useState({ mode: "", username: "", token: "" });

  return (
    <div className="min-h-screen bg-[#eef1f5] px-3 py-4">
      <div className="mx-auto min-h-[calc(100vh-32px)] max-w-[430px] overflow-hidden rounded-[28px] bg-white shadow-[0_16px_50px_rgba(15,23,42,0.14)]">
        <div className="bg-[#fff8f8] px-4 py-2 text-center text-[11px] font-semibold text-[#8D0606]">
          {apiState?.online ? "API connected" : "Demo mode - backend offline"}
        </div>
        <Routes>
          <Route path="splash" element={<MobileSplash />} />
          <Route path="onboard" element={<MobileOnboard />} />
          <Route path="login" element={<MobileLogin onLogin={onLogin} />} />
          <Route path="signup" element={<MobileSignup setVerifyContext={setVerifyContext} />} />
          <Route path="forgot" element={<MobileForgot setVerifyContext={setVerifyContext} />} />
          <Route path="verify" element={<MobileVerify verifyContext={verifyContext} />} />
          <Route path="location" element={<MobileLocation />} />
          <Route path="home" element={<MobileHome cartCount={cartCount} />} />
          <Route path="detail" element={<MobileDetail setCartCount={setCartCount} />} />
          <Route path="filter" element={<MobileFilter />} />
          <Route path="cart" element={<MobileCart />} />
          <Route path="payment" element={<MobilePayment />} />
          <Route path="success" element={<MobileSuccess />} />
          <Route path="track" element={<MobileTrack />} />
          <Route path="chat" element={<MobileChat />} />
          <Route path="profile" element={<MobileProfile onLogout={onLogout} />} />
          <Route path="*" element={<Navigate to="/mobile/splash" replace />} />
        </Routes>
      </div>
    </div>
  );
}
