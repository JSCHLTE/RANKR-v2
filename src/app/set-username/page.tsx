"use client";

import { useState } from 'react';
import UsernameInput from '../signup/_components/UsernameInput';

export default function SetUsername() {
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [usernameValue, setUsernameValue] = useState("");

    const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsernameValue(e.target.value);
    };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
          <img 
          src="lion-green-t.svg"
          className="w-20 h-20"
          draggable="false"
          />
        <h1 className="text-3xl font-medium mb-1">Set your username</h1>
        <p className="text-sm text-white/50 mb-5">To continue using RANKR please set a username below</p>
        <UsernameInput onChange={handleUsername} value={usernameValue} onValidChange={setIsUsernameValid} />
        <button
            disabled={!isUsernameValid}
            className="mt-5 py-2.5 px-2.5 rounded-xl bg-[var(--accent)] text-[var(--background)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            Finish creating account
          </button>
      </div>
    </main>
  );
};