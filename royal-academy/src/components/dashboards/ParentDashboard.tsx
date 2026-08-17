import { redirect } from 'next/navigation';

export default function ParentDashboard({ firstName }: { firstName?: string }) {
  redirect('/parent');
}
