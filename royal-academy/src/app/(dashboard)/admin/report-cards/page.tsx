'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileText, Printer, ArrowLeft } from 'lucide-react';

export default function ReportCardsPage() {
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const [reportCards, setReportCards] = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeReport, setActiveReport] = useState<any>(null);

  useEffect(() => {
    fetchStructure();
  }, []);

  useEffect(() => {
    if (selectedTerm && selectedClass && !activeReport) {
      fetchReportCards();
    }
  }, [selectedTerm, selectedClass, activeReport]);

  const fetchStructure = async () => {
    try {
      const res = await fetch('/api/admin/structure');
      const data = await res.json();
      setTerms(data.academicYears?.flatMap((y: any) => y.terms) || []);
      setClasses(data.classes || []);

      const activeYear = data.academicYears?.find((y: any) => y.isActive);
      if (activeYear) {
        const activeTerm = activeYear.terms?.find((t: any) => t.isActive);
        if (activeTerm) setSelectedTerm(activeTerm.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportCards = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/report-cards?classId=${selectedClass}&termId=${selectedTerm}`);
      const data = await res.json();
      
      if (res.ok) {
        setReportCards(data.reportCards);
        setClassName(data.className);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTermName = () => {
    return terms.find(t => t.id === selectedTerm)?.name || 'Unknown Term';
  };

  const handlePrint = () => {
    window.print();
  };

  // If a specific report is active, render the printable Report Card view
  if (activeReport) {
    return (
      <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <Button variant="outline" onClick={() => setActiveReport(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
          </Button>
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" /> Print Report
          </Button>
        </div>

        {/* Printable Area */}
        <div className="bg-white p-8 sm:p-12 border rounded-xl shadow-sm print:shadow-none print:border-none print:p-0">
          <div className="text-center space-y-2 border-b-4 border-indigo-600 pb-6 mb-6">
            <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-widest">Royal Academy</h1>
            <p className="text-slate-500 uppercase tracking-widest text-sm">Excellence in Education</p>
            <h2 className="text-xl font-bold text-indigo-700 mt-4">Student Progress Report</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
            <div className="space-y-2">
              <div className="flex"><span className="font-semibold w-32">Student Name:</span> <span className="font-bold border-b border-dashed border-slate-300 flex-1">{activeReport.student.user.firstName} {activeReport.student.user.lastName}</span></div>
              <div className="flex"><span className="font-semibold w-32">Admission No:</span> <span className="border-b border-dashed border-slate-300 flex-1">{activeReport.student.admissionNumber}</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex"><span className="font-semibold w-24">Class:</span> <span className="border-b border-dashed border-slate-300 flex-1">{className} {activeReport.student.section?.name || ''}</span></div>
              <div className="flex"><span className="font-semibold w-24">Term:</span> <span className="border-b border-dashed border-slate-300 flex-1">{getTermName()}</span></div>
            </div>
          </div>

          <table className="w-full text-left text-sm mb-8 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-t border-b-2 border-slate-300">
                <th className="py-3 px-4 font-bold text-slate-800">Subject</th>
                <th className="py-3 px-4 font-bold text-slate-800 text-center">Att. (5)</th>
                <th className="py-3 px-4 font-bold text-slate-800 text-center">Assign. (5)</th>
                <th className="py-3 px-4 font-bold text-slate-800 text-center">CA (30)</th>
                <th className="py-3 px-4 font-bold text-slate-800 text-center">Exam (60)</th>
                <th className="py-3 px-4 font-bold text-slate-800 text-center">Total</th>
                <th className="py-3 px-4 font-bold text-slate-800 text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {activeReport.grades.map((g: any) => (
                <tr key={g.id} className="border-b border-slate-200">
                  <td className="py-3 px-4 font-semibold text-slate-700">{g.subject.name}</td>
                  <td className="py-3 px-4 text-center">{g.attendanceScore}</td>
                  <td className="py-3 px-4 text-center">{g.assignmentScore}</td>
                  <td className="py-3 px-4 text-center">{g.caScore}</td>
                  <td className="py-3 px-4 text-center">{g.examScore}</td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-700">{g.totalScore}</td>
                  <td className="py-3 px-4 text-center font-bold">{g.grade}</td>
                </tr>
              ))}
              {activeReport.grades.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 italic border-b">No grades recorded for this term.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="bg-slate-50 p-6 rounded-lg border flex justify-around items-center">
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase">Total Score</div>
              <div className="text-2xl font-bold text-slate-800">{activeReport.totalScore}</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase">Average</div>
              <div className="text-2xl font-bold text-indigo-600">{activeReport.average.toFixed(1)}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase">Class Position</div>
              <div className="text-2xl font-bold text-slate-800">
                {activeReport.position}
                <span className="text-sm text-slate-500 font-normal"> / {reportCards.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-12 text-center text-sm">
            <div>
              <div className="border-b border-slate-400 pb-2 mb-2"></div>
              <span className="font-semibold text-slate-600">Form Teacher's Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-2 mb-2"></div>
              <span className="font-semibold text-slate-600">Principal's Signature</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard List View
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Cards</h1>
          <p className="text-slate-500">Generate and print terminal report cards for students.</p>
        </div>
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

      {loading ? (
        <div className="text-center py-12 text-slate-500">Compiling report cards...</div>
      ) : reportCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportCards.map((report) => (
            <Card key={report.student.id} className="hover:shadow-md transition-shadow border-slate-200">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="font-bold text-lg text-slate-800">
                    {report.student.user.firstName} {report.student.user.lastName}
                  </div>
                  <div className="text-sm text-slate-500 mb-4">{report.student.admissionNumber}</div>
                  
                  <div className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded mb-4">
                    <span className="text-slate-600 font-medium">Average:</span>
                    <span className="font-bold text-indigo-600">{report.average.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm bg-slate-50 p-2 rounded mb-6">
                    <span className="text-slate-600 font-medium">Position:</span>
                    <span className="font-bold">{report.position}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setActiveReport(report)}
                  className="w-full bg-slate-900 hover:bg-slate-800"
                >
                  <FileText className="w-4 h-4 mr-2" /> View Report Card
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        selectedClass && selectedTerm && !loading && (
          <div className="text-center py-20 bg-white border border-dashed rounded-xl text-slate-500">
            No students found for this selection.
          </div>
        )
      )}
    </div>
  );
}
