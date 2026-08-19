import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  let userRole = "STUDENT";
  let userEmail = "";

  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload) {
        userRole = payload.role as string;
        userEmail = payload.email as string || "User";
      } else {
        redirect("/login");
      }
    } catch (e) {
      console.error("Token verification failed in layout:", e);
      redirect("/login");
    }
  } else {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RA</span>
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Royal Academy</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
            Dashboard
          </Link>
          
          {/* Admin Links */}
          {(userRole === "SUPER_ADMIN" || userRole === "SCHOOL_ADMIN") && (
            <>
              <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Users
              </Link>
              <Link href="/admin/structure" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Academics (Structure)
              </Link>
              <Link href="/admin/timetable" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Timetable
              </Link>
              <Link href="/admin/report-cards" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Report Cards
              </Link>
              <Link href="/admin/import" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Bulk Import
              </Link>
              <div className="pt-4 pb-1">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Finance</p>
              </div>
              <Link href="/admin/finance" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Overview
              </Link>
              <Link href="/admin/finance/fees" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Fee Structures
              </Link>
              <Link href="/admin/finance/invoices" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Invoices & Payments
              </Link>
            </>
          )}

          {/* Teacher Links */}
          {userRole === "TEACHER" && (
            <>
              <Link href="/teacher/attendance" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Attendance
              </Link>
              <Link href="/teacher/grades" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Grades
              </Link>
            </>
          )}

          {/* Student/Parent Links */}
          {(userRole === "STUDENT" || userRole === "PARENT") && (
            <>
              <Link href={userRole === "STUDENT" ? "/student/academics" : "/parent/academics"} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
                Academics
              </Link>
            </>
          )}
          
          {userRole === "PARENT" && (
            <Link href="/parent/finance" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium text-sm transition-colors">
              Finance & Fees
            </Link>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userEmail}</p>
              <p className="text-xs text-gray-500 truncate">{userRole}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="md:hidden flex items-center gap-2">
             <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RA</span>
            </div>
            <span className="font-bold text-gray-900">Royal Academy</span>
          </div>
          <div className="flex-1 flex justify-end items-center gap-4">
            <Link href="/profile" className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
              Profile Settings
            </Link>
            <Link href="/api/auth/logout" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Logout
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
