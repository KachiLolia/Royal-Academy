import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, CheckCircle, XCircle } from 'lucide-react';

export default async function StudentAcademicsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'STUDENT') return null;

  const activeTerm = await prisma.term.findFirst({
    where: { isActive: true },
    include: { academicYear: true }
  });

  if (!activeTerm) {
    return <div className="p-8 text-center text-gray-500">No active term found. Check back later.</div>;
  }

  const student = await prisma.student.findUnique({
    where: { userId: payload.id as string },
    include: { user: true }
  });

  if (!student) return null;

  // Fetch Grades
  const grades = await prisma.grade.findMany({
    where: {
      studentId: student.id,
      termId: activeTerm.id
    },
    include: { subject: true }
  });

  // Fetch Attendance
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      studentId: student.id,
      termId: activeTerm.id
    }
  });

  // Calculate Attendance Stats
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(a => a.status === 'PRESENT').length;
  const absentDays = attendanceRecords.filter(a => a.status === 'ABSENT').length;
  const lateDays = attendanceRecords.filter(a => a.status === 'LATE').length;
  const excusedDays = attendanceRecords.filter(a => a.status === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Academics</h1>
        <p className="text-gray-500">
          Academic performance for {activeTerm.name} ({activeTerm.academicYear.name})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No grades have been posted for this term yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3 text-center">CA (30)</th>
                      <th className="px-4 py-3 text-center">Exam (70)</th>
                      <th className="px-4 py-3 text-center">Total (100)</th>
                      <th className="px-4 py-3 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {grades.map(grade => (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{grade.subject.name}</td>
                        <td className="px-4 py-3 text-center">{grade.caScore ?? '-'}</td>
                        <td className="px-4 py-3 text-center">{grade.examScore ?? '-'}</td>
                        <td className="px-4 py-3 text-center font-bold">{grade.totalScore ?? '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            grade.grade === 'A' ? 'bg-green-100 text-green-700' :
                            grade.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                            grade.grade === 'C' ? 'bg-yellow-100 text-yellow-700' :
                            grade.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {grade.grade || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {totalDays === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                No attendance records for this term.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Total Records</span>
                  <span className="font-bold text-gray-900">{totalDays}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Present</span>
                  </div>
                  <span className="font-bold text-green-700">{presentDays}</span>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">Absent</span>
                  </div>
                  <span className="font-bold text-red-700">{absentDays}</span>
                </div>

                {(lateDays > 0 || excusedDays > 0) && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-yellow-50 p-2 rounded text-center">
                      <span className="block text-yellow-700 font-medium">Late</span>
                      <span className="block font-bold text-yellow-800">{lateDays}</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <span className="block text-blue-700 font-medium">Excused</span>
                      <span className="block font-bold text-blue-800">{excusedDays}</span>
                    </div>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Attendance Rate</span>
                    <span className="font-bold text-lg text-indigo-600">
                      {Math.round((presentDays / totalDays) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
