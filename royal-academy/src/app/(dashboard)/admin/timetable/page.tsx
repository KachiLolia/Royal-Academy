'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Clock, Save, AlertCircle } from 'lucide-react';

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
];

export default function TimetablePage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '08:45',
    subjectId: '',
    teacherId: ''
  });

  useEffect(() => {
    fetchStructure();
  }, []);

  useEffect(() => {
    if (selectedTerm && selectedClass) {
      fetchTimetable();
    } else {
      setPeriods([]);
    }
  }, [selectedTerm, selectedClass]);

  const fetchStructure = async () => {
    try {
      const res = await fetch('/api/admin/structure');
      const data = await res.json();
      setTerms(data.academicYears?.flatMap((y: any) => y.terms) || []);
      setClasses(data.classes || []);
      setSubjects(data.subjects || []);
      
      const teacherRes = await fetch('/api/admin/users?role=TEACHER');
      const teacherData = await teacherRes.json();
      setTeachers(teacherData.users || []);

      // Auto-select active term
      const activeYear = data.academicYears?.find((y: any) => y.isActive);
      if (activeYear) {
        const activeTerm = activeYear.terms?.find((t: any) => t.isActive);
        if (activeTerm) setSelectedTerm(activeTerm.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/timetable?classId=${selectedClass}&termId=${selectedTerm}`);
      const data = await res.json();
      if (res.ok) {
        setPeriods(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeriod = () => {
    if (!newPeriod.subjectId || !newPeriod.teacherId) {
      alert("Please select a subject and teacher");
      return;
    }
    
    // Create an optimistic period object for the UI
    const subject = subjects.find(s => s.id === newPeriod.subjectId);
    const teacher = teachers.find(t => t.id === newPeriod.teacherId);
    
    const periodToAdd = {
      ...newPeriod,
      // Random temp ID for UI purposes
      id: `temp-${Date.now()}`,
      subject,
      teacher
    };

    setPeriods([...periods, periodToAdd]);
    setIsModalOpen(false);
  };

  const handleRemovePeriod = (idToRemove: string) => {
    setPeriods(periods.filter(p => p.id !== idToRemove));
  };

  const handleSaveTimetable = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          termId: selectedTerm,
          periods: periods.map(p => ({
            dayOfWeek: p.dayOfWeek,
            startTime: p.startTime,
            endTime: p.endTime,
            subjectId: p.subjectId || p.subject?.id,
            teacherId: p.teacherId || p.teacher?.id
          }))
        })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      alert("Timetable saved successfully!");
      fetchTimetable(); // Refresh to get real IDs
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  // Filtering logic based on ClassSubjectTeacher assignments
  const selectedClassData = classes.find((c: any) => c.id === selectedClass);
  const subjectAssignments = selectedClassData?.subjectAssignments || [];
  
  let filteredSubjectIds = [...new Set(subjectAssignments.map((a: any) => a.subjectId))];
  let filteredTeacherIds = [...new Set(subjectAssignments.map((a: any) => a.teacherId))];

  if (newPeriod.subjectId) {
    filteredTeacherIds = [...new Set(subjectAssignments.filter((a: any) => a.subjectId === newPeriod.subjectId).map((a: any) => a.teacherId))];
  }
  if (newPeriod.teacherId) {
    filteredSubjectIds = [...new Set(subjectAssignments.filter((a: any) => a.teacherId === newPeriod.teacherId).map((a: any) => a.subjectId))];
  }

  const filteredSubjects = subjects.filter((s: any) => filteredSubjectIds.includes(s.id));
  const filteredTeachers = teachers.filter((t: any) => filteredTeacherIds.includes(t.teacherProfile?.id));


  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Class Timetables</h1>
          <p className="text-slate-500">Build and manage the weekly schedule for each class.</p>
        </div>
        
        {selectedClass && selectedTerm && (
          <Button onClick={handleSaveTimetable} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Timetable'}
          </Button>
        )}
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-xl">
          <div className="space-y-2">
            <Label>Academic Term</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedTerm} 
              onChange={(e) => setSelectedTerm(e.target.value)}
            >
              <option value="" disabled>Select Term</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Class</Label>
            <select 
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="" disabled>Select Class</option>
              {classes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
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

      {selectedClass && selectedTerm ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {DAYS.map(day => {
            const dayPeriods = periods
              .filter(p => p.dayOfWeek === day.id)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div key={day.id} className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-100 p-3 border-b text-center font-semibold text-slate-700">
                  {day.name}
                </div>
                
                <div className="p-3 flex-1 space-y-3">
                  {dayPeriods.length === 0 ? (
                    <div className="text-sm text-slate-400 text-center py-4 italic">No classes</div>
                  ) : (
                    dayPeriods.map((period, idx) => (
                      <div key={period.id || idx} className="group relative border rounded-lg p-3 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                        <button 
                          onClick={() => handleRemovePeriod(period.id)}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center text-xs font-medium text-indigo-600 mb-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {period.startTime} - {period.endTime}
                        </div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {period.subject?.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          {period.teacher?.user?.firstName} {period.teacher?.user?.lastName}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t bg-slate-50 mt-auto">
                  <Button 
                    variant="outline" 
                    className="w-full text-sm border-dashed hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={() => {
                      setNewPeriod({ ...newPeriod, dayOfWeek: day.id });
                      setIsModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Period
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white border border-dashed rounded-xl text-slate-500">
          Please select a Term and a Class to view or build the timetable.
        </div>
      )}

      {/* Add Period Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Timetable Period</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input 
                  type="time" 
                  value={newPeriod.startTime} 
                  onChange={e => setNewPeriod({...newPeriod, startTime: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input 
                  type="time" 
                  value={newPeriod.endTime} 
                  onChange={e => setNewPeriod({...newPeriod, endTime: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newPeriod.subjectId} 
                onChange={(e) => setNewPeriod({...newPeriod, subjectId: e.target.value})}
              >
                <option value="">-- Select Subject --</option>
                {filteredSubjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Teacher</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={newPeriod.teacherId} 
                onChange={(e) => setNewPeriod({...newPeriod, teacherId: e.target.value})}
              >
                <option value="">-- Select Teacher --</option>
                {filteredTeachers.map((t: any) => (
                  <option key={t.teacherProfile?.id} value={t.teacherProfile?.id}>{t.firstName} {t.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPeriod} className="bg-indigo-600 hover:bg-indigo-700">Add to Timetable</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
