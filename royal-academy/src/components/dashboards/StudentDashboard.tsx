import { redirect } from 'next/navigation';

export default function StudentDashboard({ firstName }: { firstName?: string }) {
  redirect('/student');
  return null;
}
