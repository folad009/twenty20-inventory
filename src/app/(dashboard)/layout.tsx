import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/layout/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email,
        role: (session.user.role as Role) ?? Role.VIEWER,
      }}
    >
      {children}
    </AppShell>
  );
}
