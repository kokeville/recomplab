import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const COLORS = {
  bg: "#0A0A0A", card: "#181818", line: "#2A2A2A",
  accent: "#1DB954", text: "#FFFFFF", muted: "#A7A7A7",
};

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogIn = async () => {
    setError(""); setInfo(""); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setBusy(false);
  };

  const handleSignUp = async () => {
    setError(""); setInfo(""); setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setInfo("Check your email to confirm your account.");
    setBusy(false);
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "'Barlow', sans-serif" }}
      className="flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div style={{ background: COLORS.accent }} className="h-6 w-1.5 rounded-full" />
          <h1 style={{ color: COLORS.text, fontFamily: "'Barlow Condensed', sans-serif" }}
            className="text-3xl font-extrabold uppercase leading-none tracking-tight">
            Recomp<span style={{ color: COLORS.accent }}>Lab</span>
          </h1>
        </div>

        <div style={{ background: COLORS.card, borderColor: COLORS.line }}
          className="rounded-lg border p-4">
          <label style={{ color: COLORS.muted }} className="block text-[11px] font-bold uppercase tracking-widest">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.text }}
            className="mt-1 mb-3 w-full rounded-md border px-3 py-2 text-sm outline-none"
            placeholder="you@example.com"
          />

          <label style={{ color: COLORS.muted }} className="block text-[11px] font-bold uppercase tracking-widest">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ background: COLORS.bg, borderColor: COLORS.line, color: COLORS.text }}
            className="mt-1 mb-4 w-full rounded-md border px-3 py-2 text-sm outline-none"
            placeholder="••••••••"
          />

          {error && (
            <p style={{ color: "#F0C33C" }} className="mb-3 text-sm font-medium">{error}</p>
          )}
          {info && (
            <p style={{ color: COLORS.accent }} className="mb-3 text-sm font-medium">{info}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleLogIn}
              disabled={busy}
              style={{ background: COLORS.accent, color: "#0A0A0A" }}
              className="flex-1 rounded-md py-2 text-sm font-bold uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
            >
              Log In
            </button>
            <button
              onClick={handleSignUp}
              disabled={busy}
              style={{ background: "transparent", borderColor: COLORS.accent, color: COLORS.accent }}
              className="flex-1 rounded-md border py-2 text-sm font-bold uppercase tracking-wider transition active:scale-95 disabled:opacity-50"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
