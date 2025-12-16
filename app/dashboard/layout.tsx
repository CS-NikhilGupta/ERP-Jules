"use client";

import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { useStore } from "@/store/useStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { fetchUserSession } = useStore();

  useEffect(() => {
    fetchUserSession();
  }, [fetchUserSession]);

  // Protected Route Logic (Basic)
  useEffect(() => {
    // If we finished loading and there is no user, redirect to login
    // Note: This is a client-side check. For better security, Middleware is preferred,
    // but this suffices for MVP.
    // We need a flag to know if we are done checking session.
    // For now we check if currentUser is null after a small delay or similar,
    // but better to just let the login page handle redirection if accessed directly.
    // Here we just want to ensure we fetch the session.
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar className="hidden md:block" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
             {/* Mobile header placeholder - in real app would have hamburger menu */}
             <span className="font-semibold">Lumina ERP</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
