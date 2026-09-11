import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

// Invokes a panelOps action with toast feedback and optional refresh.
export function usePanelOps() {
  const [busy, setBusy] = useState(false);

  const run = async (action, payload = {}, opts = {}) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("panelOps", { action, ...payload });
      const data = res.data;
      if (data && data.error) throw new Error(data.error);
      if (opts.successMsg !== false) {
        toast({ title: opts.successMsg || "Operacja zakończona", variant: "success" });
      }
      if (opts.onSuccess) await opts.onSuccess(data);
      return data;
    } catch (e) {
      toast({ title: "Błąd", description: e.message || "Operacja nieudana", variant: "destructive" });
      throw e;
    } finally {
      setBusy(false);
    }
  };

  return { run, busy };
}
