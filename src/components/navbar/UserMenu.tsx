import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons/faUser";
import { faRightFromBracket, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { logOut } from "@/lib/auth";
import ProfilePicture from "../profile/ProfilePicture";

interface UserProfile {
  username: string;
  displayName: string;
  pfp: string;
}

type UserMenuProps = {
  profile: UserProfile;
  setUserMenu: (mode: boolean) => void;
  theme: string,
  toggleTheme: () => void;
};

export const UserMenu = ({ profile, setUserMenu, theme, toggleTheme }: UserMenuProps) => {

  return (
    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-[var(--white)]/10 bg-[var(--background)] shadow-xl overflow-hidden z-50">
      
      {/* User info header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--white)]/10">
        <ProfilePicture 
          src={profile?.pfp}
          alt={`${profile.displayName} profile picture`}
          className="w-9 h-9"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-[var(--white)] truncate">{profile.displayName}</span>
          <span className="text-xs text-[var(--white)]/40 truncate">@{profile.username}</span>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-2 py-2 flex flex-col gap-0.5">
        <Link
          href={`/user/${profile.username}`}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--white)]/70 hover:text-[var(--white)] hover:bg-[var(--white)]/5 transition-all"
          onClick={() => setUserMenu(false)}
        >
          <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 shrink-0" />
          Your profile
        </Link>

        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--white)]/70 hover:text-[var(--white)] hover:bg-[var(--white)]/5 transition-all w-full cursor-pointer">
          <FontAwesomeIcon icon={theme === "dark" ? faSun : faMoon} />
          Toggle {theme === "dark" ? "light" : "dark"} mode
        </button>

        <button
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-[var(--danger)] hover:bg-[var(--danger)]/5 transition-all w-full cursor-pointer"
          onClick={async () => {
              await logOut();
              setUserMenu(false);
          }}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-3.5 h-3.5 shrink-0" />
          Log out
        </button>
      </div>

    </div>
  );
};