"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/types/menu";

/** Runs a server action, shows a toast with the outcome and refreshes the page data. */
export function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <T extends object>(
      action: () => Promise<ActionResult<T>>,
      successMessage: string,
      onSuccess?: (result: T) => void,
    ) => {
      startTransition(async () => {
        const result = await action();
        if (result.ok) {
          toast(successMessage);
          onSuccess?.(result);
          router.refresh();
        } else {
          toast(result.error, "error");
        }
      });
    },
    [router, toast],
  );

  return { run, pending };
}
