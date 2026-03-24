"use client";

import { useState, useEffect } from "react";

type UsernameInputProps = {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setIsUsernameValid: (isValid: boolean) => void;
  };

  const usernameCheck = (username: string) => {
    if(username.length < 3 || username.length > 16) return false;
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(username)) return false;
  };

const UsernameInput = ({ value, onChange, setIsUsernameValid }: UsernameInputProps) => {
  const [status, setStatus] = useState<"idle" | "checking" | "taken" | "available" | "invalid">("idle");

  useEffect(() => {
    if(!value) return setStatus("idle");
    if(!usernameCheck(value)) return setStatus("invalid");

    const timeout = setTimeout(async () => {
      setStatus("checking");

      const available = true;
      setStatus(available ? "available" : "taken");
    }, 500)
  }, [value]);

  useEffect(() => {
    setIsUsernameValid(status === "available");
  }, [status]);

  return (
    <input
    type="text"
    name="username"
    placeholder="Username"
    value={value}
    onChange={onChange}
    required
    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--accent)] transition-colors"
  />
  )
};

export default UsernameInput