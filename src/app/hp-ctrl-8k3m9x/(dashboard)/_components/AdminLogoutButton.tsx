"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/hp-ctrl-8k3m9x/logout", { method: "POST" });
    router.push("/hp-ctrl-8k3m9x/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </button>
  );
}
