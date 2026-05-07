"use client";

import { useState, useEffect } from "react";

type UsernameInputProps = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onValidChange: (isValid: boolean) => void;
  };

  const usernameCheck = (username: string) => {
    if(username.length < 3 || username.length > 16) return false;
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) return false;
    return true;
  };

const UsernameInput = ({ value, onChange, onValidChange }: UsernameInputProps) => {
  const [status, setStatus] = useState<"idle" | "checking" | "taken" | "available" | "invalid">("idle");

  useEffect(() => {
    if(!value) return setStatus("idle");
    if(!usernameCheck(value)) return setStatus("invalid");

    const timeout = setTimeout(async () => {
      setStatus("checking");
      const res = await fetch(`/api/check-username?username=${value}`)
      const { available } = await res.json()
      setStatus(available ? "available" : "taken")
    }, 500)
    return () => clearTimeout(timeout)
  }, [value]);

  useEffect(() => {
    onValidChange(status === "available");
  }, [status]);

  return (
    <div className="w-full">
      <div className="relative">
        <input
          type="text"
          name="username"
          placeholder="Username"
          autoComplete="off"
          value={value}
          onChange={onChange}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-[var(--white)]/10 bg-[var(--white)]/5 text-sm placeholder:text-[var(--white)]/20 focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--white)]/20 text-xs select-none">
          {`${value.length}/16`}
        </span>
      </div>
      {status === "checking" && <p className="text-xs mt-1 text-[var(--white)]/40">Checking...</p>}
      {status === "taken" && <p className="text-xs mt-1 text-[var(--danger)]">Username already taken</p>}
      {status === "available" && <p className="text-xs mt-1 text-[var(--accent)]">✓ Available</p>}
      {status === "invalid" && <p className="text-xs mt-1 text-[var(--danger)]">3–16 chars, must start with a letter</p>}
    </div>
  )
};

export default UsernameInput