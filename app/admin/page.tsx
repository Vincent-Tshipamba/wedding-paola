import { Suspense } from "react";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { eventSettings, guests, tables } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { AdminApp } from "@/components/admin/AdminApp";

export default function AdminPage() {
    return (
        <Suspense fallback={<main className="grid min-h-svh place-items-center text-cream/60">Loading…</main>}>
            <AdminContent />
        </Suspense>
    );
}

async function AdminContent() {
    await requireAdmin();
    const [guestRows, tableRows, settings] = await Promise.all([
        db.select().from(guests).orderBy(desc(guests.createdAt)),
        db.select().from(tables).orderBy(asc(tables.name)),
        db.select().from(eventSettings),
    ]);
    return <AdminApp guests={guestRows} tables={tableRows} settings={settings} />;
}