"use client";

type UsernameInputProps = {
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onValidChange: (isValid: boolean) => void
  };

const UsernameInput = ({ value, onChange, onValidChange }: UsernameInputProps) => {
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
}

export default UsernameInput