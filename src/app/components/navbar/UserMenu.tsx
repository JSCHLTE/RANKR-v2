import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons/faUser";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { logOut } from "@/lib/auth";

interface UserProfile {
  username: string;
  displayName: string;
  pfp: string;
  isPaid: boolean;
}

type UserMenuProps = {
  profile: UserProfile;
  setUserMenu: (mode: boolean) => void;
};

export const UserMenu = ({ profile, setUserMenu }: UserMenuProps) => {

  return (
    <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[var(--background)] shadow-xl overflow-hidden z-50">
      
      {/* User info header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <img
          src={profile.pfp}
          alt={`${profile.displayName} profile picture`}
          className="w-9 h-9 rounded-full object-cover shrink-0"
          draggable="false"
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-white truncate">{profile.displayName}</span>
          <span className="text-xs text-white/40 truncate">@{profile.username}</span>
        </div>
      </div>

      {/* Menu items */}
      <div className="px-2 py-2 flex flex-col gap-0.5">
        <Link
          href={`/user/${profile.username}`}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 shrink-0" />
          Your profile
        </Link>

        <button
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-all w-full cursor-pointer"
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