import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { guests, tables } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { AdminApp } from "@/components/admin/AdminApp";

export default async function AdminPage() {
    await requireAdmin();
    const [guestRows, tableRows] = await Promise.all([
        db.select().from(guests).orderBy(desc(guests.createdAt)),
        db.select().from(tables).orderBy(asc(tables.name)),
    ]);
    return <AdminApp guests={guestRows} tables={tableRows} />;
}