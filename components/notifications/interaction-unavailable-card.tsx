import { Card } from "@/components/ui/card";

export function InteractionUnavailableCard() {
  return (
    <Card>
      <h2 className="text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100">
        Etkileşim gönder
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
        Partnerin davet koduyla katıldığında ona sevgi mesajları ve etkileşimler
        gönderebilirsin.
      </p>
    </Card>
  );
}
