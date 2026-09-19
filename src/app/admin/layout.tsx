"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminNavbar } from "@/components/layout/admin-navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-0 min-w-0">
        <AdminNavbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
