import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Calendar } from 'lucide-react';

export default async function StudentDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'STUDENT') return null;

  const student = await prisma.student.findUnique({
    where: { userId: payload.id as string },
    include: {
      class: {
        include: {
          sections: true
        }
      },
      section: true,
      user: true
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Portal</h1>
        <p className="text-gray-500">Welcome back, {student?.user.firstName}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 border-b pb-4 mb-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{student?.user.firstName} {student?.user.lastName}</h3>
                <p className="text-sm text-gray-500">{student?.admissionNumber}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Class:</span>
                <span className="font-medium">{student?.class?.name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Section:</span>
                <span className="font-medium capitalize">{student?.section?.name || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/student/academics" className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">Academics</h3>
                <p className="text-sm text-gray-500 mt-1">View your grades, continuous assessments, and attendance records.</p>
              </div>
            </Link>
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed">
              <Calendar className="w-5 h-5 mt-0.5" />
              <div>
                <h3 className="font-semibold">Timetable (Coming Soon)</h3>
                <p className="text-sm mt-1">View your class schedule and subjects.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
