"use client";

import { useState, useEffect } from 'react';
import UsernameInput from '../signup/_components/UsernameInput';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SetUsername() {
    const { user, loading, hasProfile, refreshProfile } = useAuth();
    const router = useRouter();
    const [isUsernameValid, setIsUsernameValid] = useState(false);
    const [usernameValue, setUsernameValue] = useState("");
    const [seededPfp, setSeededPFP] = useState("");
    const [pfpReroll, setPfpReroll] = useState(0);
    const [error, setError] = useState("");
    const [process, setProcess] = useState(false);


    const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUsernameValue(e.target.value);
    };
  
    const avatarSrc = `https://api.dicebear.com/9.x/initials/svg?seed=${
      seededPfp ? `${seededPfp}${pfpReroll ? `-${pfpReroll}` : ""}` : "RANKR"
    }&backgroundType=gradientLinear`;

    const reroll = () => {
      setPfpReroll(prev => prev + 1);
    };

    useEffect(() => {
      const pfpDebounce = setTimeout(() => {
        setSeededPFP(usernameValue);
      }, 250);
      return () => clearTimeout(pfpDebounce);
    }, [usernameValue]);

    async function handleSignUp(e: React.FormEvent) {
      e.preventDefault();
      setError("");
      setProcess(true);

      if(!user) {
        router.push("/signup");
        return;
      }

      const token = await user.getIdToken();
    
      try {    
        const res = await fetch("/api/set-username", {
          method: "POST",
          body: JSON.stringify({ username: usernameValue, pfp: avatarSrc }),
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
           },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        await refreshProfile(user!);
        router.push("/");

      }  catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        };
      } finally {
        setProcess(false);
      }
    }

    if(loading || hasProfile) return null;

  return ( user && !hasProfile &&
    <main className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
          <img 
          src="lion-green-t.svg"
          className="w-20 h-20"
          draggable="false"
          />
        <h1 className="text-3xl font-medium mb-1">Set your username</h1>
        <p className="text-sm text-[var(--white)]/50 mb-5">To continue using RANKR please set a username below</p>
        <form onSubmit={handleSignUp}>
        <UsernameInput onChange={handleUsername} value={usernameValue} onValidChange={setIsUsernameValid} />
                  {/* PFP Section */}
            <div className='mt-5'>
              <label className="block text-xs font-medium text-[var(--white)]/50 mb-3">Profile Picture</label>
              <div className="flex items-start gap-4">

                {/* Avatar preview */}
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={avatarSrc}
                    alt="Profile picture preview"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <span className="text-xs text-[var(--white)]/30">Preview</span>
                </div>

                {/* Regenerate button */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    type="button"
                    className="w-16 h-16 rounded-full border border-dashed border-[var(--accent)]/50 bg-transparent hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all flex items-center justify-center cursor-pointer text-[1.5rem]"
                    onClick={reroll}
                  >
                    <FontAwesomeIcon icon={faRotate} className="text-[var(--accent)]"/>
                  </button>
                  <span className="text-xs text-[var(--white)]/30">Reroll gradient</span>
                </div>

              </div>
          </div>
          {error && (
            <p className="mt-5 text-sm text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-lg px-4 py-2.5">
              {error}
            </p>
          )}
        <button
            type='submit'
            disabled={!isUsernameValid}
            className="mt-5 py-2.5 px-2.5 rounded-xl bg-[var(--accent)] text-[var(--background)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {process ? "Finishing account..." : "Finish Sign Up"}
          </button>
          </form>
      </div>
    </main>
  );
};