"use client";

import { useActionState } from "react";
import { uploadReceiptAction } from "@/actions/receipts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Input";

export default function ReceiptUploadForm() {
  const [state, action, pending] = useActionState(uploadReceiptAction, null);

  return (
    <Card className="mt-6 p-6">
      <h2 className="text-[15px] font-[590] tracking-[-0.012em] text-paper">
        Scan a receipt
      </h2>
      <p className="mt-1 max-w-lg text-sm text-fog">
        Paste receipt text or upload a photo - Renuevo extracts the merchant
        and total and suggests it as a subscription.
      </p>
      <form action={action} className="mt-4 flex flex-col gap-4">
        <Field label="Receipt text" htmlFor="receipt-text">
          <textarea
            id="receipt-text"
            name="text"
            rows={4}
            placeholder={"WORLD GYM\nTotal: €29.00\n2026-08-15"}
            className="w-full rounded-(--radius-input) border border-graphite bg-void px-3 py-2 font-mono text-sm text-paper placeholder:text-fog/60 focus:border-smoke focus:outline-none"
          />
        </Field>
        <Field label="Or upload an image" htmlFor="receipt-image">
          <input
            id="receipt-image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/tiff,image/bmp"
            className="w-full text-sm text-fog file:mr-3 file:rounded-(--radius-btn) file:border file:border-graphite file:bg-white/[0.03] file:px-3 file:py-1.5 file:text-[13px] file:text-paper"
          />
        </Field>
        {state?.error && (
          <p className="rounded-(--radius-input) bg-coral-red/10 px-3 py-2 text-sm text-coral-red">
            {state.error}
          </p>
        )}
        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Scanning…" : "Scan receipt"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
