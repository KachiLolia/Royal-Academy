'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle } from 'lucide-react';

export default function TeacherGradesPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTerm, setActiveTerm] = useState<any>(null);
  
  const [selectedAssignment, setSelectedAssignment] = useState<string>('');
  
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedAssignment && activeTerm) {
      fetchGrades();
    } else {
      setStudents([]);
    }
  }, [selectedAssignment, activeTerm]);

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

  const fetchGrades = async () => {
    setLoading(true);
    setError('');
    try {
      const assignment = assignments.find(a => a.id === selectedAssignment);
      if (!assignment) return;

      const res = await fetch(`/api/teacher/grades?classId=${assignment.classId}&subjectId=${assignment.subjectId}&termId=${activeTerm.id}`);
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

  const calculateGradeLetter = (total: number) => {
    if (total >= 75) return 'A';
    if (total >= 65) return 'B';
    if (total >= 50) return 'C';
    if (total >= 40) return 'D';
    return 'F';
  };

  const handleScoreChange = (studentId: string, field: string, value: string) => {
    let numVal = parseFloat(value);
    if (isNaN(numVal)) numVal = 0;

    // Validation caps
    if (field === 'attendanceScore' && numVal > 5) numVal = 5;
    if (field === 'assignmentScore' && numVal > 5) numVal = 5;
    if (field === 'caScore' && numVal > 30) numVal = 30;
    if (field === 'examScore' && numVal > 60) numVal = 60;
    if (numVal < 0) numVal = 0;

    setStudents(prev => prev.map(s => {
      if (s.student.id !== studentId) return s;
      
      const updated = { ...s, [field]: numVal };
      const total = (parseFloat(updated.attendanceScore) || 0) + 
                    (parseFloat(updated.assignmentScore) || 0) + 
                    (parseFloat(updated.caScore) || 0) + 
                    (parseFloat(updated.examScore) || 0);
      
      updated.totalScore = total;
      updated.grade = calculateGradeLetter(total);
      return updated;
    }));
  };

  const handleSave = async () => {
    const assignment = assignments.find(a => a.id === selectedAssignment);
    if (!assignment || !activeTerm) return;

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/teacher/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: assignment.subjectId,
          termId: activeTerm.id,
          records: students.map(s => ({
            studentId: s.student.id,
            attendanceScore: s.attendanceScore,
            assignmentScore: s.assignmentScore,
            caScore: s.caScore,
            examScore: s.examScore,
            remarks: s.remarks
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Grades saved successfully!");
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mark Grades</h1>
          <p className="text-slate-500">Record CA and Exam scores for your students.</p>
        </div>
        
        {students.length > 0 && (
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Grades'}
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
        <CardContent className="p-4 bg-slate-50 rounded-xl">
          <div className="space-y-2 max-w-md">
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
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">Student Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700 w-24">Att. (5)</th>
                <th className="px-4 py-3 font-semibold text-slate-700 w-24">Assign. (5)</th>
                <th className="px-4 py-3 font-semibold text-slate-700 w-24">CA (30)</th>
                <th className="px-4 py-3 font-semibold text-slate-700 w-24">Exam (60)</th>
                <th className="px-4 py-3 font-semibold text-slate-700 w-24">Total</th>
                <th className="px-4 py-3 font-semibold text-slate-700 w-16">Grade</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((row) => (
                <tr key={row.student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {row.student.user.firstName} {row.student.user.lastName}
                    </div>
                    <div className="text-xs text-slate-500">{row.student.admissionNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      min="0" max="5" step="1"
                      className="w-16 h-8 text-center"
                      value={row.attendanceScore || ''}
                      onChange={e => handleScoreChange(row.student.id, 'attendanceScore', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      min="0" max="5" step="1"
                      className="w-16 h-8 text-center"
                      value={row.assignmentScore || ''}
                      onChange={e => handleScoreChange(row.student.id, 'assignmentScore', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      min="0" max="30" step="0.5"
                      className="w-16 h-8 text-center"
                      value={row.caScore || ''}
                      onChange={e => handleScoreChange(row.student.id, 'caScore', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="number" 
                      min="0" max="60" step="0.5"
                      className="w-16 h-8 text-center"
                      value={row.examScore || ''}
                      onChange={e => handleScoreChange(row.student.id, 'examScore', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-700 px-2">
                      {row.totalScore || 0}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-bold px-2 ${row.grade === 'F' ? 'text-red-500' : 'text-emerald-600'}`}>
                      {row.grade || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Input 
                      type="text" 
                      placeholder="Optional remark..."
                      className="h-8"
                      value={row.remarks || ''}
                      onChange={e => setStudents(prev => prev.map(s => 
                        s.student.id === row.student.id ? { ...s, remarks: e.target.value } : s
                      ))}
                    />
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
