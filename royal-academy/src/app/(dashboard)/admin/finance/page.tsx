import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, AlertCircle, Users } from "lucide-react";
import Link from 'next/link';

export default async function FinanceOverviewPage() {
  const activeTerm = await prisma.term.findFirst({
    where: { isActive: true },
    include: { academicYear: true }
  });

  if (!activeTerm) {
    return <div className="p-8 text-center text-gray-500">No active term found.</div>;
  }

  // Aggregate stats
  const invoices = await prisma.studentFee.findMany({
    where: {
      feeStructure: {
        termId: activeTerm.id
      }
    }
  });

  let totalExpected = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  
  let fullyPaidCount = 0;
  let partialPaidCount = 0;
  let unpaidCount = 0;

  invoices.forEach(inv => {
    totalExpected += inv.amountDue;
    totalCollected += inv.amountPaid;
    totalOutstanding += (inv.amountDue - inv.amountPaid);
    
    if (inv.status === 'PAID') fullyPaidCount++;
    else if (inv.status === 'PARTIAL') partialPaidCount++;
    else unpaidCount++;
  });

  // Recent payments
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      studentFee: {
        include: {
          student: {
            include: { user: true, class: true }
          },
          feeStructure: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance Overview</h1>
        <p className="text-gray-500">Financial summary for {activeTerm.name} ({activeTerm.academicYear.name})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalExpected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on generated invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Total Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalExpected > 0 ? ((totalCollected/totalExpected)*100).toFixed(1) : 0}% of expected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₦{totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending collection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span className="text-green-600">Fully Paid:</span> <span>{fullyPaidCount}</span></div>
              <div className="flex justify-between"><span className="text-yellow-600">Partial:</span> <span>{partialPaidCount}</span></div>
              <div className="flex justify-between"><span className="text-red-600">Unpaid:</span> <span>{unpaidCount}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-gray-500">No recent transactions.</p>
            ) : (
              <div className="space-y-4">
                {recentPayments.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">
                        {payment.studentFee.student.user.firstName} {payment.studentFee.student.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payment.studentFee.feeStructure.name} • {payment.method}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">+₦{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        {payment.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t text-center">
              <Link href="/admin/finance/invoices" className="text-sm text-indigo-600 hover:underline">
                View All Invoices & Payments →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/finance/fees" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-gray-900">Define Fee Structures</h3>
              <p className="text-sm text-gray-500 mt-1">Set up tuition and other charges for classes.</p>
            </Link>
            <Link href="/admin/finance/invoices" className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-gray-900">Generate Invoices</h3>
              <p className="text-sm text-gray-500 mt-1">Assign fees to students and record payments.</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
