import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TeacherDashboard({ firstName = "Teacher" }: { firstName?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-gray-500">Welcome to your classes and schedule.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/teacher/attendance" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-gray-900">Attendance</h3>
              <p className="text-sm text-gray-500 mt-1">Mark daily attendance for your assigned classes.</p>
            </Link>
            <Link href="/teacher/grades" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-gray-900">Grades</h3>
              <p className="text-sm text-gray-500 mt-1">Input scores for continuous assessments and exams.</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
