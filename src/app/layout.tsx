import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RANKR",
  description: "Fantasy Rankings App by Jordan Schulte",
};

import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/navbar/navbar";
import { ThemeProvider } from "@/context/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const theme = localStorage.getItem("theme");

                  const systemDark =
                    window.matchMedia &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches;

                  const finalTheme = theme ?? (systemDark ? "dark" : "light");

                  document.documentElement.classList.remove("light", "dark");
                  document.documentElement.classList.add(finalTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            <Navbar />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
