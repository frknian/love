"use client";

import { RouteErrorState } from "@/components/ui/route-error-state";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="tr">
      <body>
        <RouteErrorState
          description="Uygulama beklenmeyen bir sorunla karşılaştı. Verilerin güvende; tekrar deneyebilirsin."
          retry={reset}
          title="Bir şeyler ters gitti"
        />
      </body>
    </html>
  );
}
