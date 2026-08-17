import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export default async function ParentDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'PARENT') return null;

  const parent = await prisma.parent.findUnique({
    where: { userId: payload.id as string },
    include: {
      user: true,
      students: {
        include: {
          student: {
            include: { user: true, class: true }
          }
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parent Portal</h1>
        <p className="text-gray-500">Welcome back, {parent?.user.firstName}.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Wards</CardTitle>
          </CardHeader>
          <CardContent>
            {parent?.students.length === 0 ? (
              <p className="text-sm text-gray-500">No children linked to your account.</p>
            ) : (
              <div className="space-y-4">
                {parent?.students.map(ps => (
                  <div key={ps.student.id} className="flex items-center gap-3 border-b pb-2 last:border-0 last:pb-0">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{ps.student.user.firstName} {ps.student.user.lastName}</p>
                      <p className="text-sm text-gray-500">{ps.student.class?.name || 'Unassigned'} • {ps.student.admissionNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/parent/academics" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-indigo-100 p-2 rounded text-indigo-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Academics</h3>
              </div>
              <p className="text-sm text-gray-500">View grades, continuous assessments, and attendance records.</p>
            </Link>

            <Link href="/parent/finance" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 mb-1">
                <div className="bg-green-100 p-2 rounded text-green-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Finance & Fees</h3>
              </div>
              <p className="text-sm text-gray-500">View outstanding balances and pay tuition securely online.</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
