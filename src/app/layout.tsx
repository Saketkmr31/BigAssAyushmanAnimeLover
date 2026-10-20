import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
export const metadata: Metadata = { title: "Velvet Vault — Private 18+ Members Gallery", description: "A private, invite-only gallery for consenting adults." };
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body><AuthProvider><Header/><main className="container-app min-h-[calc(100vh-150px)] py-7">{children}</main><footer className="mt-16 border-t border-white/10 py-8"><div className="container-app flex flex-col justify-between gap-4 text-sm text-zinc-500 sm:flex-row"><span>© 2026 Velvet Vault · Private members only · 18+</span><div className="flex gap-5"><a href="/vault" className="hover:text-white">Gallery</a><a href="/vault" className="hover:text-white">Members</a><a href="/login" className="hover:text-white">Account</a></div></div></footer></AuthProvider></body></html>;
}
