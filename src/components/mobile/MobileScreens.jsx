import React, { useState } from "react";
import {
  ChevronRight,
  Globe2,
  Heart,
  Home,
  MessageSquareText,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, getApiErrorMessage } from "../../api";
import { createProfileFile } from "../../utils/helpers";
import { IconGraphic } from "../ui/IconGraphic";
import { popularDishes, trendingMenus, foodImages } from "../../constants/mockData";

/* ------------------------------------------------------------------ */
/* Shared mobile input                                                   */
/* ------------------------------------------------------------------ */
export function MobileInput({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-[#777]">{label}</span>
      <input className="h-12 w-full rounded-md bg-[#f0f1f4] px-4 text-sm outline-none" {...props} />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Shared mobile logo                                                   */
/* ------------------------------------------------------------------ */
export function MobileLogo({ compact = false }) {
  return (
    <div className={`flex items-center gap-2 ${compact ? "" : "justify-center"}`}>
      <div>
        <img src="/assets/logo.png" alt="" className="size-16" />
      </div>
      <span className="text-lg font-semibold uppercase leading-[0.9]">Cloud<br />Kitchens</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile header                                                         */
/* ------------------------------------------------------------------ */
export function MobileHeader({ cartCount = 0, title }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between px-5 pb-3 pt-5">
      {title ? (
        <button className="grid size-9 place-items-center rounded-full bg-[#8D0606] text-white" onClick={() => navigate("/mobile/home")} type="button">
          <ChevronRight className="rotate-180" size={18} />
        </button>
      ) : (
        <MobileLogo className="text-[#8D0606]" compact />
      )}
      {title ? <h1 className="text-lg font-semibold">{title}</h1> : null}
      <button className="relative grid size-10 place-items-center rounded-full bg-[#8D0606] text-white" onClick={() => navigate("/mobile/cart")} type="button">
        <ShoppingBag size={18} />
        {cartCount ? <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-orange-400 text-xs font-semibold">{cartCount}</span> : null}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile bottom nav                                                     */
/* ------------------------------------------------------------------ */
export function MobileBottomNav({ active }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-x-0 bottom-4 mx-auto flex max-w-[390px] justify-center px-6">
      <div className="flex gap-2 rounded-full bg-white/95 p-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        {[["home", Home, "/mobile/home"], ["cart", ShoppingBag, "/mobile/cart"], ["track", Truck, "/mobile/track"], ["chat", MessageSquareText, "/mobile/chat"], ["profile", UserRound, "/mobile/profile"]].map(([name, Icon, path]) => (
          <button key={name} className={`grid size-10 place-items-center rounded-full ${active === name ? "bg-[#8D0606] text-white" : "text-[#777]"}`} onClick={() => navigate(path)} type="button">
            <IconGraphic icon={Icon} size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile splash screen                                                  */
/* ------------------------------------------------------------------ */
export function MobileSplash() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[760px] flex-col justify-between bg-white px-8 py-12">
      <div />
      <div className="rounded-md bg-[#8D0606] px-6 py-4 text-white"><MobileLogo compact /></div>
      <button className="h-12 rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={() => navigate("/mobile/onboard")} type="button">START</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile onboard screen                                                */
/* ------------------------------------------------------------------ */
export function MobileOnboard() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[760px] flex-col justify-between bg-white px-8 py-10 text-center">
      <div className="pt-14">
        <div className="mx-auto grid size-44 place-items-center rounded-full bg-[#fff3dc] text-7xl">🍽</div>
        <h1 className="mt-10 text-xl font-semibold">All your favorites</h1>
        <p className="mx-auto mt-4 max-w-[260px] text-sm leading-6 text-[#8b8b8b]">Get all your loved foods in one place, you just place the order we do the rest.</p>
        <p className="mt-5 text-[#8D0606]">● ● ○ ○</p>
      </div>
      <div>
        <button className="h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={() => navigate("/mobile/login")} type="button">NEXT</button>
        <button className="mt-4 text-xs text-[#999]" onClick={() => navigate("/mobile/login")} type="button">Skip</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile login screen                                                   */
/* ------------------------------------------------------------------ */
export function MobileLogin({ onLogin }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage("");
    try {
      await onLogin(credentials);
      navigate("/mobile/home");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[760px] bg-white">
      <div className="rounded-b-[18px] bg-[#8D0606] px-8 py-12 text-center text-white">
        <h1 className="text-xl font-semibold">Log In</h1>
        <p className="mt-3 text-xs text-white/80">Please sign in to your existing account</p>
      </div>
      <div className="space-y-4 px-7 py-8">
        <MobileInput label="Email" placeholder="demo@gmail.com" value={credentials.username} onChange={(e) => setCredentials((c) => ({ ...c, username: e.target.value }))} />
        <MobileInput label="Password" placeholder="Password" type="password" value={credentials.password} onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))} />
        <div className="flex items-center justify-between text-xs text-[#8b8b8b]">
          <label className="flex items-center gap-2"><input type="checkbox" /> Remember me</label>
          <button className="text-[#8D0606]" onClick={() => navigate("/mobile/forgot")} type="button">Forgot Password</button>
        </div>
        <button className="h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={submit} type="button">{busy ? "..." : "LOG IN"}</button>
        {message ? <p className="whitespace-pre-line text-center text-xs font-semibold text-[#8D0606]">{message}</p> : null}
        <p className="text-center text-xs text-[#777]">Don&apos;t have an account? <button className="text-[#8D0606]" onClick={() => navigate("/mobile/signup")} type="button">SIGN UP</button></p>
        <div className="flex justify-center gap-5 pt-3 text-lg">
          <span>f</span><span>t</span><span>●</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile signup screen                                                  */
/* ------------------------------------------------------------------ */
export function MobileSignup({ setVerifyContext }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const updateForm = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async () => {
    if (form.password !== form.confirmPassword) { setMessage("Passwords do not match"); return; }
    setBusy(true);
    setMessage("");
    try {
      const [firstName, ...lastNameParts] = (form.name || "Mobile User").trim().split(/\s+/);
      await api.register({
        kitchenName: form.name || "Cloud Kitchen Mobile",
        phone: form.phone,
        email: form.email,
        password: form.password,
        contactTitle: "MR",
        contactFirstName: firstName || "Mobile",
        contactLastName: lastNameParts.join(" ") || "User",
        contactEmail: form.email,
        contactPhone: form.phone,
        profilePicture: createProfileFile(),
      });
      setVerifyContext?.({ mode: "signup", username: form.email || form.phone, token: "" });
      navigate("/mobile/verify");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Signup failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Sign Up" />
      <div className="rounded-b-[18px] bg-[#8D0606] px-8 py-8 text-center text-white">
        <h1 className="text-xl font-semibold">Sign Up</h1>
        <p className="mt-3 text-xs text-white/80">Please sign up to get started</p>
      </div>
      <div className="space-y-4 px-7 py-8">
        <MobileInput label="Name" placeholder="John Doe" value={form.name} onChange={updateForm("name")} />
        <MobileInput label="Email" placeholder="demo@gmail.com" value={form.email} onChange={updateForm("email")} />
        <MobileInput label="Phone" placeholder="9876543210" value={form.phone} onChange={updateForm("phone")} />
        <MobileInput label="Password" placeholder="Password" type="password" value={form.password} onChange={updateForm("password")} />
        <MobileInput label="Re-type Password" placeholder="Password" type="password" value={form.confirmPassword} onChange={updateForm("confirmPassword")} />
        <button className="h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={submit} type="button">{busy ? "..." : "SEND CODE"}</button>
        {message ? <p className="whitespace-pre-line text-center text-xs font-semibold text-[#8D0606]">{message}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile forgot password screen                                         */
/* ------------------------------------------------------------------ */
export function MobileForgot({ setVerifyContext }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  const submit = async () => {
    try {
      const response = await api.forgotPassword(username);
      setVerifyContext?.({ mode: "reset", username, token: response?.data?.resetToken || response?.resetToken || "" });
      setMessage("Reset requested.");
      navigate("/mobile/verify");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Request failed"));
    }
  };

  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Forgot Password" />
      <div className="rounded-b-[18px] bg-[#8D0606] px-8 py-8 text-center text-white">
        <h1 className="text-xl font-semibold">Forgot Password</h1>
        <p className="mt-3 text-xs text-white/80">Please sign in to your existing account</p>
      </div>
      <div className="space-y-5 px-7 py-8">
        <MobileInput label="Email" placeholder="demo@gmail.com" value={username} onChange={(e) => setUsername(e.target.value)} />
        <button className="h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={submit} type="button">SEND CODE</button>
        {message ? <p className="whitespace-pre-line text-center text-xs font-semibold text-[#8D0606]">{message}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile verify screen                                                  */
/* ------------------------------------------------------------------ */
export function MobileVerify({ verifyContext }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(verifyContext?.token || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (verifyContext?.mode !== "reset") { navigate("/mobile/location"); return; }
    if (password !== confirmPassword) { setMessage("Passwords do not match"); return; }
    setBusy(true);
    setMessage("");
    try {
      await api.resetPassword({ token, password, confirmPassword });
      setMessage("Password reset successful.");
      navigate("/mobile/login");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Verification failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Verification" />
      <div className="rounded-b-[18px] bg-[#8D0606] px-8 py-8 text-center text-white">
        <h1 className="text-xl font-semibold">Verification</h1>
        <p className="mt-3 text-xs text-white/80">{verifyContext?.mode === "reset" ? "Enter reset token and new password" : "Registration completed"}</p>
      </div>
      <div className="space-y-4 px-7 py-8">
        {verifyContext?.mode === "reset" ? (
          <>
            <MobileInput label="Reset Token" placeholder="Token" value={token} onChange={(e) => setToken(e.target.value)} />
            <MobileInput label="New Password" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <MobileInput label="Confirm Password" placeholder="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </>
        ) : (
          <p className="rounded-md bg-[#fff1f1] px-4 py-3 text-center text-xs font-semibold text-[#8D0606]">Email OTP endpoint is not available in backend yet. Continue to login/location.</p>
        )}
        <button className="h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white disabled:opacity-60" disabled={busy} onClick={submit} type="button">{busy ? "..." : "VERIFY"}</button>
        {message ? <p className="whitespace-pre-line text-center text-xs font-semibold text-[#8D0606]">{message}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile location screen                                                */
/* ------------------------------------------------------------------ */
export function MobileLocation() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[760px] flex-col justify-between bg-white px-8 py-10 text-center">
      <MobileHeader title="Location" />
      <div>
        <div className="mx-auto grid size-52 place-items-center text-8xl">📍</div>
        <h1 className="mt-8 text-xl font-semibold">Location</h1>
        <p className="mx-auto mt-3 max-w-[260px] text-sm leading-6 text-[#777]">Find restaurants near you by allowing location access.</p>
      </div>
      <button className="h-12 rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={() => navigate("/mobile/home")} type="button">ACCESS LOCATION</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile restaurant card                                                */
/* ------------------------------------------------------------------ */
export function MobileRestaurantCard() {
  const navigate = useNavigate();
  return (
    <button className="mt-4 w-full rounded-lg bg-white text-left shadow-sm" onClick={() => navigate("/mobile/detail")} type="button">
      <img src={foodImages[1]} alt="" className="h-36 w-full rounded-lg object-cover" />
      <h2 className="mt-3 px-1 text-sm font-semibold">Medium Spicy Pizza with Kemangi Leaf</h2>
      <div className="flex gap-5 px-1 py-3 text-xs text-[#777]">
        <span className="text-[#8D0606]">★ 4.8</span><span>Free</span><span>25 min</span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile home screen                                                    */
/* ------------------------------------------------------------------ */
export function MobileHome({ cartCount }) {
  const navigate = useNavigate();
  const cats = ["All", "Hot Dog", "Burger"];
  return (
    <div className="min-h-[760px] bg-white pb-5">
      <MobileHeader cartCount={cartCount} />
      <div className="px-5">
        <p className="text-xs font-semibold text-[#777]">Hey Good Afternoon!</p>
        <button className="mt-3 flex h-11 w-full items-center gap-3 rounded-md bg-[#f2f3f5] px-4 text-left text-xs text-[#8b8b8b]" type="button">
          <Search size={16} /> Search dishes, restaurants
        </button>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-semibold">All Categories</p>
          <button className="text-xs text-[#8D0606]" type="button">See All &gt;</button>
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {cats.map((cat, index) => (
            <button key={cat} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${index === 0 ? "bg-[#8D0606] text-white" : "bg-[#f5f1e8]"}`} type="button">{cat}</button>
          ))}
        </div>
        <MobileRestaurantCard />
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-semibold">Popular Fast Food</p>
          <button className="text-xs text-[#8D0606]" onClick={() => navigate("/mobile/filter")} type="button">Filter</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {popularDishes.slice(1).map((dish) => (
            <button key={dish[0]} className="rounded-lg border border-[#eee] bg-white p-3 text-left shadow-sm" onClick={() => navigate("/mobile/detail")} type="button">
              <img src={dish[2]} alt="" className="h-20 w-full rounded-md object-cover" />
              <p className="mt-2 text-sm font-semibold">{dish[0]}</p>
              <p className="text-xs text-[#8D0606]">{dish[1]}</p>
            </button>
          ))}
        </div>
      </div>
      <MobileBottomNav active="home" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile detail screen                                                  */
/* ------------------------------------------------------------------ */
export function MobileDetail({ setCartCount }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Details" />
      <div className="px-5 pb-6">
        <div className="relative overflow-hidden rounded-lg bg-[#8D0606]">
          <img src={foodImages[3]} alt="" className="h-52 w-full object-cover opacity-95" />
          <button className="absolute bottom-4 right-4 grid size-10 place-items-center rounded-full bg-white text-[#8D0606]" type="button"><Heart fill="currentColor" size={19} /></button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-[#777]"><Globe2 size={15} /> Uttara Coffee House</div>
        <h1 className="mt-3 text-xl font-semibold">Pizza Calzone European</h1>
        <p className="mt-3 text-sm leading-6 text-[#777]">Premium restaurant meal with fresh ingredients, crispy crust and chef prepared sauce.</p>
        <div className="mt-4 flex gap-6 text-xs text-[#777]"><span className="text-[#8D0606]">★ 4.8</span><span>Free</span><span>20 min</span></div>
        <div className="mt-6 flex gap-3">
          {["10\"", "14\"", "20\""].map((size, i) => <button key={size} className={`size-12 rounded-full text-sm font-semibold ${i === 1 ? "bg-[#8D0606] text-white" : "bg-[#f4f4f4]"}`} type="button">{size}</button>)}
        </div>
        <div className="mt-8 flex items-center justify-between">
          <b className="text-lg">$6.53</b>
          <div className="flex items-center rounded-full bg-black px-4 py-2 text-white"><button type="button">-</button><span className="px-4">2</span><button type="button">+</button></div>
        </div>
        <button className="mt-7 h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={() => { setCartCount?.((n) => n + 1); navigate("/mobile/cart"); }} type="button">ADD TO CART</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile cart screen                                                    */
/* ------------------------------------------------------------------ */
export function MobileCart() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[760px] bg-[#8D0606] text-white">
      <MobileHeader title="Cart" />
      <div className="space-y-4 px-5 py-5">
        {trendingMenus.slice(0, 3).map((item) => (
          <div key={item[0]} className="flex gap-3 rounded-lg bg-white/10 p-3">
            <img src={item[3]} alt="" className="size-16 rounded-md object-cover" />
            <div className="flex-1"><p className="text-sm font-semibold">{item[0]}</p><p className="mt-2 text-xs">{item[1]} x1</p></div>
            <div className="text-sm">+ -</div>
          </div>
        ))}
      </div>
      <div className="mt-2 rounded-t-[28px] bg-white px-5 py-6 text-[#191919]">
        <label className="block text-xs text-[#777]">Delivery Address</label>
        <div className="mt-2 rounded-md bg-[#f4f4f4] p-4 text-xs">2118 Thornridge Cir. Syracuse...</div>
        <div className="mt-5 flex justify-between text-sm"><span>Total</span><b>$360</b></div>
        <button className="mt-5 h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={() => navigate("/mobile/payment")} type="button">PLACE ORDER</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile payment screen                                                 */
/* ------------------------------------------------------------------ */
export function MobilePayment() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Payment" />
      <div className="px-6 py-8 text-center">
        <div className="mx-auto mb-6 grid h-24 w-56 place-items-center rounded-lg border border-[#eee] text-lg font-semibold text-[#8D0606]">VISA&nbsp; MasterCard</div>
        <p className="text-sm font-semibold">No master card added</p>
        <p className="mx-auto mt-2 max-w-[240px] text-xs leading-5 text-[#888]">You can add a card and save it for later checkout.</p>
        <button className="mt-6 h-11 w-full rounded-md border border-[#8D0606] text-sm font-semibold text-[#8D0606]" type="button">ADD NEW</button>
        <div className="mt-12 flex justify-between text-sm"><span>Total</span><b>$360</b></div>
        <button className="mt-5 h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={() => navigate("/mobile/success")} type="button">PAY & CONFIRM</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile success screen                                                 */
/* ------------------------------------------------------------------ */
export function MobileSuccess() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-[760px] flex-col justify-between bg-white px-8 py-12 text-center">
      <div />
      <div>
        <div className="mx-auto grid size-40 place-items-center rounded-full bg-[#fff3dc] text-7xl">🎉</div>
        <h1 className="mt-10 text-xl font-semibold">Congratulations</h1>
        <p className="mt-3 text-xs leading-5 text-[#888]">You successfully placed a payment. Enjoy your order.</p>
      </div>
      <button className="h-12 rounded-md bg-[#8D0606] text-sm font-semibold text-white" onClick={() => navigate("/mobile/track")} type="button">TRACK ORDER</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile track screen                                                   */
/* ------------------------------------------------------------------ */
export function MobileTrack() {
  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Track Order" />
      <div className="mx-5 mt-4 h-[420px] rounded-lg bg-[#dce8ef] p-4">
        <div className="h-full rounded-lg bg-[linear-gradient(45deg,#c9dce8_25%,transparent_25%),linear-gradient(-45deg,#c9dce8_25%,transparent_25%)] bg-[length:48px_48px]" />
      </div>
      <div className="mx-5 -mt-12 rounded-lg bg-white p-4 shadow-lg">
        <img src={foodImages[3]} alt="" className="float-left mr-3 size-16 rounded-md object-cover" />
        <p className="text-sm font-semibold">Main Course</p>
        <p className="text-xs text-[#777]">Arrives at 09:30 PM, 10 July</p>
      </div>
      <MobileBottomNav active="track" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile chat screen                                                    */
/* ------------------------------------------------------------------ */
export function MobileChat() {
  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Robert Fox" />
      <div className="space-y-4 px-5 py-8">
        {["Hi, Congratulations for order", "Your Pizza is on the way", "I'm coming, just wait..."].map((msg, i) => (
          <p key={msg} className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${i === 1 ? "ml-auto bg-orange-400 text-white" : "bg-[#f3f3f3]"}`}>{msg}</p>
        ))}
      </div>
      <div className="mx-5 mt-40 flex rounded-full bg-[#f4f4f4] p-2"><input className="flex-1 bg-transparent px-3 text-sm outline-none" placeholder="Write message" /><button className="grid size-10 place-items-center rounded-full bg-orange-400 text-white" type="button">➤</button></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile profile screen                                                 */
/* ------------------------------------------------------------------ */
export function MobileProfile({ onLogout }) {
  const navigate = useNavigate();
  const logout = () => { onLogout?.(); navigate("/mobile/login"); };

  return (
    <div className="min-h-[760px] bg-white">
      <MobileHeader title="Edit Profile" />
      <div className="rounded-b-[28px] bg-[#8D0606] px-8 py-9 text-center text-white">
        <div className="mx-auto grid size-24 place-items-center rounded-full bg-orange-300"><UserRound size={60} fill="currentColor" /></div>
      </div>
      <div className="space-y-4 px-7 py-8">
        <MobileInput label="Name" placeholder="John Doe" />
        <MobileInput label="Email" placeholder="demo@gmail.com" />
        <MobileInput label="Phone Number" placeholder="+2457890" />
        <MobileInput label="Bio" placeholder="I love fast food" />
        <button className="h-12 w-full rounded-md bg-[#8D0606] text-sm font-semibold text-white" type="button">SAVE</button>
        <button className="h-12 w-full rounded-md bg-[#fff1f1] text-sm font-semibold text-[#8D0606]" onClick={logout} type="button">LOGOUT</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter group helper                                                   */
/* ------------------------------------------------------------------ */
export function FilterGroup({ title, items }) {
  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-semibold">{title}</p>
      <div className="flex flex-wrap gap-2">{items.map((item, i) => <button key={item} className={`rounded-full px-3 py-2 text-xs ${i === 0 ? "bg-[#8D0606] text-white" : "bg-[#f4f4f4]"}`} type="button">{item}</button>)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mobile filter screen                                                  */
/* ------------------------------------------------------------------ */
export function MobileFilter() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[760px] bg-[#575757] px-6 py-8">
      <div className="ml-auto min-h-[690px] max-w-[300px] rounded-md bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Filter your search</h2><button className="grid size-7 place-items-center rounded-full bg-[#8D0606] text-white" onClick={() => navigate("/mobile/home")} type="button">×</button></div>
        <FilterGroup title="Offers" items={["Delivery", "Pick Up", "Offer"]} />
        <FilterGroup title="Delivery Time" items={["10-15 min", "20 min", "30 min"]} />
        <FilterGroup title="Pricing" items={["$", "$$", "$$$"]} />
        <div className="mt-6"><p className="mb-3 text-xs font-semibold">Rating</p><p className="text-[#ffc400]">★ ★ ★ ★ ☆</p></div>
        <button className="mt-10 h-11 w-full rounded-md bg-[#8D0606] text-xs font-semibold text-white" onClick={() => navigate("/mobile/home")} type="button">FILTER</button>
      </div>
    </div>
  );
}
