"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

export default function StructurePage() {
  const [data, setData] = useState<any>({ academicYears: [], classes: [], subjects: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [yearName, setYearName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [className, setClassName] = useState("");
  const [sections, setSections] = useState(""); // comma separated

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/structure");
      const json = await res.json();
      if (res.ok) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (type: string, payload: any) => {
    try {
      const res = await fetch("/api/admin/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data: payload }),
      });
      if (res.ok) {
        alert("Created successfully!");
        fetchData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (e) {
      alert("Failed to create.");
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      const res = await fetch(`/api/admin/structure?type=${type}&id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (e) {
      alert("Failed to delete.");
    }
  };

  const submitYear = () => {
    handleSubmit("academicYear", { name: yearName, startDate, endDate, isActive: true });
  };

  const submitClass = () => {
    const sectionArray = sections.split(",").map(s => s.trim()).filter(Boolean);
    handleSubmit("class", { name: className, sections: sectionArray });
  };

  const submitSubject = () => {
    handleSubmit("subject", { name: subjectName, code: subjectCode });
  };

  if (isLoading) return <div className="p-8">Loading structure data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academic Structure</h1>
        <p className="text-gray-500">Manage academic years, classes, and subjects.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ACADEMIC YEAR */}
        <Card>
          <CardHeader>
            <CardTitle>Create Academic Year</CardTitle>
            <CardDescription>Set up a new school year.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Year Name (e.g., 2026/2027)</Label>
              <Input value={yearName} onChange={(e) => setYearName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button onClick={submitYear} disabled={!yearName || !startDate || !endDate}>Create Year</Button>
            
            <div className="pt-4 mt-4 border-t">
              <h3 className="font-semibold text-sm mb-2">Existing Years</h3>
              <ul className="text-sm space-y-1">
                {data.academicYears.map((y: any) => (
                  <li key={y.id} className="flex justify-between items-center group">
                    <div>
                      <span>{y.name}</span>
                      <span className={`ml-2 text-xs ${y.isActive ? "text-green-600 font-bold" : "text-gray-400"}`}>
                        {y.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <button onClick={() => handleDelete('academicYear', y.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CLASS */}
        <Card>
          <CardHeader>
            <CardTitle>Create Class</CardTitle>
            <CardDescription>Add a class and its sections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class Name (e.g., JSS 1)</Label>
              <Input value={className} onChange={(e) => setClassName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sections (comma separated, e.g., A, B, C)</Label>
              <Input value={sections} onChange={(e) => setSections(e.target.value)} />
            </div>
            <Button onClick={submitClass} disabled={!className}>Create Class</Button>

            <div className="pt-4 mt-4 border-t">
              <h3 className="font-semibold text-sm mb-2">Existing Classes</h3>
              <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                {data.classes.map((c: any) => (
                  <li key={c.id} className="flex justify-between items-start group">
                    <div className="flex flex-col">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-gray-500 text-xs">
                        Sections: {c.sections.map((s: any) => s.name).join(", ") || "None"}
                      </span>
                    </div>
                    <button onClick={() => handleDelete('class', c.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* SUBJECT */}
        <Card>
          <CardHeader>
            <CardTitle>Create Subject</CardTitle>
            <CardDescription>Define a subject for the school.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject Name (e.g., Mathematics)</Label>
              <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subject Code (e.g., MTH-JSS1)</Label>
              <Input value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} />
            </div>
            <Button onClick={submitSubject} disabled={!subjectName || !subjectCode}>Create Subject</Button>

            <div className="pt-4 mt-4 border-t">
              <h3 className="font-semibold text-sm mb-2">Existing Subjects</h3>
              <ul className="text-sm space-y-1 max-h-48 overflow-y-auto">
                {data.subjects.map((s: any) => (
                  <li key={s.id} className="flex justify-between items-center group">
                    <div className="flex flex-col">
                      <span>{s.name}</span>
                      <span className="text-gray-500 text-xs">{s.code}</span>
                    </div>
                    <button onClick={() => handleDelete('subject', s.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
