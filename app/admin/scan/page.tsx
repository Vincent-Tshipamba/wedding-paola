import { ScannerApp } from "@/components/admin/ScannerApp";
import { requireStaff } from "@/lib/auth";
import { getTotals } from "@/lib/scan-actions";

export default async function ScanPage() {
    const role = await requireStaff();
    return <ScannerApp initialTotals={await getTotals()} isAdmin={role === "admin"} />;
}