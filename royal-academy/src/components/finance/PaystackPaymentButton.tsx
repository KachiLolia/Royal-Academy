"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePaystackPayment } from 'react-paystack';

export default function PaystackPaymentButton({ invoice, onSuccess }: { invoice: any, onSuccess: (ref: any) => void }) {
  const balance = invoice.amountDue - invoice.amountPaid;
  const config = {
    reference: (new Date()).getTime().toString(),
    email: invoice.student?.user?.email || "parent@example.com",
    amount: balance * 100, // Paystack amounts are in kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
  };

  // @ts-ignore - The types for usePaystackPayment might be slightly off in some versions
  const initializePayment = usePaystackPayment(config);

  return (
    <Button onClick={() => {
      initializePayment({
        onSuccess: (reference: any) => onSuccess(reference),
        onClose: () => alert("Payment cancelled")
      });
    }} className="w-full sm:w-auto">
      <CreditCard className="w-4 h-4 mr-2" />
      Pay Now Online
    </Button>
  );
}
