"use client";

import { useState, useEffect } from "react";
import { CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Payment Recording State
  const [recordingPaymentFor, setRecordingPaymentFor] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    fetchStructure();
  }, []);

  useEffect(() => {
    if (selectedTerm) fetchInvoices();
  }, [selectedTerm, selectedClass]);

  const fetchStructure = async () => {
    try {
      const res = await fetch('/api/admin/structure');
      if (res.ok) {
        const data = await res.json();
        
        // Extract terms from academicYears
        let allTerms: any[] = [];
        data.academicYears?.forEach((ay: any) => {
          if (ay.terms) {
            ay.terms.forEach((t: any) => {
              allTerms.push({ ...t, academicYear: ay });
            });
          }
        });
        setTerms(allTerms);
        
        const active = allTerms.find((t: any) => t.isActive);
        if (active) setSelectedTerm(active.id);
        
        if (data.classes) {
          setClasses(data.classes);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTerm) params.append('termId', selectedTerm);
      if (selectedClass) params.append('classId', selectedClass);
      
      const res = await fetch(`/api/admin/finance/invoices?${params.toString()}`);
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvoices = async () => {
    if (!selectedTerm || !selectedClass) {
      alert("Please select a term and a class to generate invoices for.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/finance/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termId: selectedTerm, classId: selectedClass })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Successfully generated ${data.count} new invoices.`);
        fetchInvoices();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecordPayment = async (invoiceId: string) => {
    if (!paymentAmount || isNaN(Number(paymentAmount)) || Number(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    setIsPaying(true);
    try {
      const res = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentFeeId: invoiceId,
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentRef
        })
      });
      if (res.ok) {
        setRecordingPaymentFor(null);
        setPaymentAmount("");
        setPaymentRef("");
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices & Payments</h1>
          <p className="text-gray-500">Manage student billing and record manual payments.</p>
        </div>
        <Button onClick={handleGenerateInvoices} disabled={isGenerating || !selectedTerm || !selectedClass} className="flex gap-2">
          <FileText className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Generate Invoices for Class"}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Academic Term</Label>
          <select 
            className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
          >
            <option value="">Select Term</option>
            {terms.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Class (Filter/Generate Target)</Label>
          <select 
            className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Fee Structure</th>
                <th className="px-6 py-4">Amount Due</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No invoices found.</td></tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {invoice.student.user.firstName} {invoice.student.user.lastName}
                      </div>
                      <div className="text-gray-500 text-xs">{invoice.student.class?.name} • {invoice.student.admissionNumber}</div>
                    </td>
                    <td className="px-6 py-4">{invoice.feeStructure.name}</td>
                    <td className="px-6 py-4 font-medium">₦{invoice.amountDue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">₦{invoice.amountPaid.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.status !== 'PAID' && recordingPaymentFor !== invoice.id && (
                        <Button variant="outline" size="sm" onClick={() => setRecordingPaymentFor(invoice.id)}>
                          Record Payment
                        </Button>
                      )}
                      {recordingPaymentFor === invoice.id && (
                        <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                          <Input 
                            type="number" 
                            placeholder="Amount" 
                            className="w-24 h-8 text-sm" 
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                          />
                          <select 
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                            value={paymentMethod}
                            onChange={e => setPaymentMethod(e.target.value)}
                          >
                            <option value="CASH">Cash</option>
                            <option value="BANK_TRANSFER">Transfer</option>
                          </select>
                          <Button size="sm" onClick={() => handleRecordPayment(invoice.id)} disabled={isPaying}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRecordingPaymentFor(null)}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
