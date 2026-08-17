import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, BookOpen, Banknote, Calendar, CreditCard } from "lucide-react";

export default async function AdminDashboard({ firstName = "Admin" }: { firstName?: string }) {
  const [totalStudents, totalTeachers, activeClasses] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
  ]);

  // Calculate pending fees
  const unpaidFees = await prisma.studentFee.findMany({
    where: { status: { in: ['PENDING', 'PARTIAL'] } },
    select: { amountDue: true, amountPaid: true }
  });
  
  const pendingFeesTotal = unpaidFees.reduce((acc, fee) => acc + (fee.amountDue - fee.amountPaid), 0);

  // Calculate total revenue
  const revenueResult = await prisma.payment.aggregate({
    where: { status: 'SUCCESS' },
    _sum: { amount: true }
  });
  const totalRevenue = revenueResult._sum.amount || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-gray-500">Overview of your school's operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalTeachers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{activeClasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(pendingFeesTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/users" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-xs text-gray-500">Students, Teachers, Parents</p>
            </div>
          </Link>

          <Link href="/admin/finance" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Finance & Fees</h3>
              <p className="text-xs text-gray-500">Invoices, Payments, Structures</p>
            </div>
          </Link>

          <Link href="/admin/structure" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Academic Structure</h3>
              <p className="text-xs text-gray-500">Classes, Sections, Subjects</p>
            </div>
          </Link>

          <Link href="/admin/timetable" className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Timetable</h3>
              <p className="text-xs text-gray-500">Manage schedules</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
