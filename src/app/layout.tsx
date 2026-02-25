import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RANKR",
  description: "Fantasy Rankings App by Jordan Schulte",
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
