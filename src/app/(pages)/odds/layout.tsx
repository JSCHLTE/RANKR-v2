import type { ReactNode } from "react";
import { OddsPreferencesProvider } from "@/components/odds/OddsPreferences";
export default function OddsLayout({ children }: { children: ReactNode }) {
  return <OddsPreferencesProvider><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main></OddsPreferencesProvider>;
}
