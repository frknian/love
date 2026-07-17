"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast-provider";
import { profileService } from "@/services/profile/profile-service";
import { genderLabels, genderOptions, type Gender } from "@/types/profile";

interface GenderSettingsCardProps {
  initialGender: Gender;
}

export function GenderSettingsCard({ initialGender }: GenderSettingsCardProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [gender, setGender] = useState(initialGender);
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(nextGender: Gender) {
    const previous = gender;
    setGender(nextGender);
    setIsSaving(true);
    try {
      await profileService.updateGender(nextGender);
      showToast("Cinsiyet bilgisi güncellendi.");
      router.refresh();
    } catch {
      setGender(previous);
      showToast("Cinsiyet bilgisi güncellenemedi.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-slate-800 dark:text-slate-100">
          Cinsiyet
        </p>
        {isSaving ? (
          <LoaderCircle
            aria-label="Cinsiyet bilgisi kaydediliyor"
            className="size-4 animate-spin text-rose-500"
          />
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Bu bilgi yalnızca gerekli özellikleri yetkilendirmek için kullanılır ve
        partner profiline gösterilmez.
      </p>
      <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Seçimin
        <select
          className="mt-2 w-full rounded-xl border border-rose-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-300 disabled:opacity-60 dark:bg-slate-800"
          disabled={isSaving}
          onChange={(event) => void handleChange(event.target.value as Gender)}
          value={gender}
        >
          {genderOptions.map((option) => (
            <option key={option} value={option}>
              {genderLabels[option]}
            </option>
          ))}
        </select>
      </label>
    </Card>
  );
}
