
import { redirect } from 'next/navigation';

// This page is obsolete. The functionality has been merged into the main HRMS employees page.
// We redirect to avoid having two different pages for the same purpose.
export default function ObsoleteStoreStaffPage() {
    redirect('/dashboard/hrms/employees');
}
