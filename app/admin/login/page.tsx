import { LoginForm } from "@/components/admin/LoginForm";

// `next` = where to go after signing in (so the installed apps return to their own page).
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const { next } = await searchParams;
    return <LoginForm next={next ?? ""} />;
}