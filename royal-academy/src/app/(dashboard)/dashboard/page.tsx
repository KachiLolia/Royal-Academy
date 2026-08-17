import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import TeacherDashboard from "@/components/dashboards/TeacherDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import ParentDashboard from "@/components/dashboards/ParentDashboard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) {
    redirect("/login");
  }

  let role = "STUDENT";
  let firstName = "User";
  try {
    const payload = await verifyToken(token);
    if (payload) {
      role = payload.role as string;
      const { prisma } = await import('@/lib/prisma');
      const user = await prisma.user.findUnique({ where: { id: payload.id as string } });
      if (user) {
        firstName = user.firstName;
      }
    }
  } catch (e) {
    redirect("/login");
  }

  if (role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN") {
    return <AdminDashboard firstName={firstName} />;
  }

  if (role === "TEACHER") {
    return <TeacherDashboard firstName={firstName} />;
  }

  if (role === "STUDENT") {
    return <StudentDashboard firstName={firstName} />;
  }

  if (role === "PARENT") {
    return <ParentDashboard firstName={firstName} />;
  }

  return <div>Unknown role</div>;
}
