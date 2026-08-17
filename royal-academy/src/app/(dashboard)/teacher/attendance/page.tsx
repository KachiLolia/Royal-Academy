'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function TeacherAttendancePage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTerm, setActiveTerm] = useState<any>(null);
  
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedAssignment && date && activeTerm) {
      fetchAttendance();
    } else {
      setStudents([]);
    }
  }, [selectedAssignment, date, activeTerm]);

  const fetchInitialData = async () => {
    try {
      // Get Term
      const structRes = await fetch('/api/admin/structure');
      const structData = await structRes.json();
      const activeYear = structData.academicYears?.find((y: any) => y.isActive);
      if (activeYear) {
        const term = activeYear.terms?.find((t: any) => t.isActive);
        setActiveTerm(term);
      }

      // Get Assignments
      const assignRes = await fetch('/api/teacher/assignments');
      const assignData = await assignRes.json();
      if (assignRes.ok) {
        setAssignments(assignData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const assignment = assignments.find(a => a.id === selectedAssignment);
      if (!assignment) return;

      const res = await fetch(`/api/teacher/attendance?classId=${assignment.classId}&subjectId=${assignment.subjectId}&date=${date}`);
      const data = await res.json();
      
      if (res.ok) {
        setStudents(data);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setStudents(prev => prev.map(s => 
      s.student.id === studentId ? { ...s, status } : s
    ));
  };

  const handleSave = async () => {
    const assignment = assignments.find(a => a.id === selectedAssignment);
    if (!assignment || !activeTerm) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: assignment.subjectId,
          termId: activeTerm.id,
          date,
          records: students.map(s => ({
            studentId: s.student.id,
            status: s.status,
            remarks: s.remarks
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Attendance saved successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mark Attendance</h1>
          <p className="text-slate-500">Record daily subject attendance for your classes.</p>
        </div>
        
        {students.length > 0 && (
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </Button>
        )}
      </div>

      {!activeTerm && (
        <div className="bg-amber-50 text-amber-600 p-4 rounded-lg flex items-center border border-amber-200">
          <AlertCircle className="w-5 h-5 mr-2" />
          No active Academic Term found. Please contact the administrator.
        </div>
      )}

      <Card className="border-none shadow-md">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-xl">
          <div className="space-y-2">
            <Label>Class & Subject</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedAssignment} 
              onChange={(e) => setSelectedAssignment(e.target.value)}
            >
              <option value="" disabled>Select a class you teach</option>
              {assignments.map((a: any) => (
                <option key={a.id} value={a.id}>{a.class?.name} - {a.subject?.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Date</Label>
            <Input 
              type="date" 
              className="bg-white"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center border border-red-200">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading students...</div>
      ) : students.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Student Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Admission No.</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((row) => (
                <tr key={row.student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">
                      {row.student.user.firstName} {row.student.user.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {row.student.admissionNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleStatusChange(row.student.id, 'PRESENT')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                          row.status === 'PRESENT' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-white text-slate-500 border hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(row.student.id, 'ABSENT')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                          row.status === 'ABSENT' 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-white text-slate-500 border hover:bg-slate-50'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(row.student.id, 'LATE')}
                        className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                          row.status === 'LATE' 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : 'bg-white text-slate-500 border hover:bg-slate-50'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" /> Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        selectedAssignment && !loading && (
          <div className="text-center py-20 bg-white border border-dashed rounded-xl text-slate-500">
            No students found in this class.
          </div>
        )
      )}
    </div>
  );
}
