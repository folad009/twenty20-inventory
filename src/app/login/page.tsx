import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginPageContent } from "@/components/auth/login-page-content";

type LoginPageProps = {
  searchParams: Promise<{ cleared?: string; callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  // Proxy clears stale cookies and redirects here; skip auth() to avoid JWT errors.
  if (params.cleared !== "1") {
    const session = await auth();
    if (session?.user) {
      redirect(params.callbackUrl ?? "/");
    }
  }

  return <LoginPageContent />;
}
