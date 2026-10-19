import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
export const metadata: Metadata = { title: "BigAssAyushmanAnimeLover — Discover your next anime", description: "Explore anime, browse seasons, and keep track of what you watch." };
export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="en"><body><Header/><main className="container-app min-h-[calc(100vh-150px)] py-7">{children}</main><footer className="mt-16 border-t border-white/10 py-8"><div className="container-app flex flex-col justify-between gap-4 text-sm text-zinc-500 sm:flex-row"><span>© 2026 BigAssAyushmanAnimeLover · Independent demo project</span><div className="flex gap-5"><a href="/browse" className="hover:text-white">Browse</a><a href="/az-list" className="hover:text-white">A–Z List</a><a href="/login" className="hover:text-white">Account</a></div></div></footer></body></html>;
}