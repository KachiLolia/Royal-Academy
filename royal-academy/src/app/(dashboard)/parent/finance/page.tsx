"use client";

import { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';

const PaystackPaymentButton = dynamic(
  () => import('@/components/finance/PaystackPaymentButton'),
  { ssr: false }
);

export default function ParentFinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/parent/finance/invoices');
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaystackSuccess = async (referenceObj: any, invoiceId: string, amount: number) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentFeeId: invoiceId,
          amount,
          method: 'ONLINE',
          reference: referenceObj.reference
        })
      });

      if (res.ok) {
        alert("Payment Successful!");
        fetchInvoices();
      } else {
        const err = await res.json();
        alert(`Payment verification failed: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during payment verification.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance & Fees</h1>
        <p className="text-gray-500">View and pay your outstanding tuition and school fees.</p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl border">No invoices found for your children.</div>
      ) : (
        <div className="grid gap-6">
          {invoices.map((invoice) => {
            const balance = invoice.amountDue - invoice.amountPaid;
            const isPaid = invoice.status === 'PAID';
            
            return (
              <div key={invoice.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
                      {invoice.student.user.firstName} {invoice.student.user.lastName}
                    </span>
                    <span className="text-gray-500 text-xs">{invoice.feeStructure.term.name}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{invoice.feeStructure.name}</h3>
                  <div className="text-sm text-gray-500 mt-1 space-y-1">
                    <p>Total Fee: ₦{invoice.amountDue.toLocaleString()}</p>
                    <p>Amount Paid: ₦{invoice.amountPaid.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Outstanding Balance</p>
                    <p className={`text-2xl font-bold ${isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{balance.toLocaleString()}
                    </p>
                  </div>
                  
                  {isPaid ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5" />
                      Fully Paid
                    </div>
                  ) : (
                    <PaystackPaymentButton 
                      invoice={invoice} 
                      onSuccess={(ref) => handlePaystackSuccess(ref, invoice.id, balance)} 
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}


    </div>
  );
}
