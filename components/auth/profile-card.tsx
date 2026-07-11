import { Crown, Heart } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { AppUser } from "@/types/auth";

export function ProfileCard({ user }: { user: AppUser }) {
  const initial = user.name.charAt(0).toUpperCase();
  const RoleIcon = user.role === "owner" ? Crown : Heart;

  return (
    <Card className="flex items-center gap-4">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rose-300 to-pink-500 text-lg font-semibold text-white shadow-sm">
        {initial}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-800">{user.name}</p>
        <p className="mt-0.5 truncate text-sm text-slate-500">{user.email}</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-xs font-medium capitalize text-rose-600">
          <RoleIcon className="size-3" />
          {user.role}
        </span>
      </div>
    </Card>
  );
}
