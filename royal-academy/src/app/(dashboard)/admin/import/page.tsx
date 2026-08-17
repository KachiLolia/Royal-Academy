"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePapaParse } from 'react-papaparse';

export default function ImportPage() {
  const { readString } = usePapaParse();
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const csvData = event.target?.result;
        if (typeof csvData === 'string') {
          readString(csvData, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => {
              const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
              if (normalized.includes('first')) return 'firstName';
              if (normalized.includes('last') || normalized.includes('surname')) return 'lastName';
              if (normalized === 'email') return 'email';
              if (normalized.includes('parentemail')) return 'parentEmail';
              if (normalized.includes('parentphone')) return 'parentPhone';
              if (normalized.includes('phone')) return 'phone';
              if (normalized.includes('staff')) return 'staffId';
              if (normalized.includes('studentadmission')) return 'studentAdmissionNumber';
              if (normalized.includes('relationship')) return 'relationship';
              if (normalized.includes('admission') || normalized.includes('admin') || normalized.includes('number')) return 'admissionNumber';
              if (normalized.includes('class')) return 'className';
              if (normalized.includes('section')) return 'sectionName';
              if (normalized.includes('subject')) return 'subjectName';
              return header.trim();
            },
            transform: (value) => value.trim(),
            complete: (res) => {
              setResults(prev => ({ ...prev, [type]: res.data }));
            },
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async (type: string) => {
    setIsLoading(prev => ({ ...prev, [type]: true }));
    setMessages(prev => ({ ...prev, [type]: "" }));
    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: results[type] || [] }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => ({ ...prev, [type]: `Success: Imported ${data.count} records.` }));
      } else {
        setMessages(prev => ({ ...prev, [type]: `Error: ${data.error}` }));
      }
    } catch (err) {
      setMessages(prev => ({ ...prev, [type]: "Failed to import." }));
    } finally {
      setIsLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const importConfigs = [
    { type: 'students', title: 'Import Students', desc: 'CSV should contain: firstName, lastName, email, admissionNumber, class, section' },
    { type: 'teachers', title: 'Import Teachers', desc: 'CSV should contain: firstName, lastName, email, staffId, phone, subject, class' },
    { type: 'parents', title: 'Import Parents', desc: 'CSV should contain: firstName, lastName, phone, email (optional)' },
    { type: 'relationships', title: 'Import Parent-Student Links', desc: 'CSV should contain: parentPhone (or parentEmail), studentAdmissionNumber, relationship' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Data Import</h1>
        <p className="text-gray-500">Upload CSV files to import users and establish relationships.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {importConfigs.map((config) => (
          <Card key={config.type}>
            <CardHeader>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleFileUpload(e, config.type)} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
              />
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button 
                  disabled={!results[config.type] || results[config.type].length === 0 || isLoading[config.type]} 
                  onClick={() => handleImport(config.type)}
                >
                  {isLoading[config.type] ? "Importing..." : `Import ${results[config.type]?.length || 0} Records`}
                </Button>
                {messages[config.type] && <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1 rounded-md border border-green-200">{messages[config.type]}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
