"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FeeStructuresPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    termId: "",
    classId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [feesRes, structRes] = await Promise.all([
        fetch('/api/admin/finance/fees'),
        fetch('/api/admin/structure')
      ]);

      if (feesRes.ok) setFees(await feesRes.json());
      
      if (structRes.ok) {
        const data = await structRes.json();
        
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
        if (active) setFormData(prev => ({ ...prev, termId: active.id }));
        
        if (data.classes) {
          setClasses(data.classes);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/finance/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData(prev => ({ ...prev, name: "", description: "", amount: "", classId: "" }));
        fetchData();
      } else {
        alert("Failed to create fee");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fee structure?")) return;
    try {
      const res = await fetch(`/api/admin/finance/fees?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Structures</h1>
        <p className="text-gray-500">Define standard tuition and other fees across the school.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Create New Fee</h2>
            
            <div className="space-y-2">
              <Label>Academic Term *</Label>
              <select 
                className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.termId}
                onChange={e => setFormData({...formData, termId: e.target.value})}
                required
              >
                <option value="">Select Term</option>
                {terms.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.academicYear?.name})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Fee Name *</Label>
              <Input 
                placeholder="e.g. Tuition Fee" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (₦) *</Label>
              <Input 
                type="number" 
                placeholder="50000" 
                min="0"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Target Class (Optional)</Label>
              <select 
                className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.classId}
                onChange={e => setFormData({...formData, classId: e.target.value})}
              >
                <option value="">All Classes (General Fee)</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">If left blank, this fee can be applied to any student.</p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Optional details" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Fee Structure"}
            </Button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-700">Existing Fee Structures</h2>
            </div>
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading fees...</div>
            ) : fees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No fee structures defined yet.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {fees.map((fee) => (
                  <div key={fee.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h3 className="font-medium text-gray-900">{fee.name}</h3>
                      <div className="text-sm text-gray-500 mt-1 flex gap-2 items-center">
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                          {fee.term?.name}
                        </span>
                        {fee.class ? (
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                            {fee.class.name}
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                            Global
                          </span>
                        )}
                        <span>{fee.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-lg">₦{fee.amount.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(fee.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
