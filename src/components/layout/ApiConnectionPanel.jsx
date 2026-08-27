import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/Card";
import { getApiErrorMessage } from "../../api";

export function ApiConnectionPanel({ apiState, onLogin, compact = false }) {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await onLogin(credentials);
      setMessage("Login successful. Live kitchen APIs connected.");
    } catch (error) {
      setMessage(getApiErrorMessage(error, "Login failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-6">
      <div className={`grid gap-5 ${compact ? "" : "xl:grid-cols-[1fr_520px] xl:items-center"}`}>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`size-3 rounded-full ${apiState.online ? "bg-[#2fc65b]" : "bg-[#ff6868]"}`} />
            <h2 className="text-xl font-semibold">Backend Connection</h2>
          </div>
          <p className="mt-2 text-sm text-[#777]">{apiState.message}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-[#f3f3f3] px-4 py-2 font-semibold">Branches: {apiState.branches.length}</span>
            <span className="rounded-full bg-[#f3f3f3] px-4 py-2 font-semibold">Menus: {apiState.menus.length}</span>
            <span className="rounded-full bg-[#f3f3f3] px-4 py-2 font-semibold">Ingredients: {apiState.ingredients.length}</span>
          </div>
          <div className="mt-5 flex gap-3">
            <button className="rounded-full bg-[#8D0606] px-5 py-2 font-semibold text-white" onClick={() => navigate("/kitchen")} type="button">Add Branch</button>
            <button className="rounded-full bg-[#fff1f1] px-5 py-2 font-semibold text-[#8D0606]" onClick={() => navigate("/add-menu")} type="button">Add Menu</button>
          </div>
        </div>

        {!apiState.token ? (
          <form className={`grid gap-3 ${compact ? "" : "sm:grid-cols-[1fr_1fr_auto]"}`} onSubmit={submit}>
            <input className="h-12 rounded-lg border border-[#e2e2e2] px-4 outline-none" placeholder="Enter email or phone" value={credentials.username} onChange={(e) => setCredentials((c) => ({ ...c, username: e.target.value }))} />
            <input className="h-12 rounded-lg border border-[#e2e2e2] px-4 outline-none" placeholder="Enter password" type="password" value={credentials.password} onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))} />
            <button className="h-12 rounded-lg bg-[#8D0606] px-6 font-semibold text-white disabled:opacity-60" disabled={busy} type="submit">{busy ? "..." : "Login"}</button>
            {message ? <p className="whitespace-pre-line text-sm font-semibold text-[#8D0606] sm:col-span-3">{message}</p> : null}
          </form>
        ) : (
          <div className="rounded-lg bg-[#F7F6F6] p-5">
            <p className="text-sm text-[#777]">Logged in as</p>
            <p className="mt-1 text-xl font-semibold">{apiState.kitchen?.kitchenName || apiState.kitchen?.email || "Kitchen"}</p>
            <p className="mt-2 text-sm text-[#777]">Protected endpoints are now enabled when onboarding/subscription exists in DB.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
