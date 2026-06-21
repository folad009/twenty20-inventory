import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { getUsersAction } from "@/server/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { DataPanel } from "@/components/shared/data-panel";
import { RoleBadge } from "@/components/shared/status-badges";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  const users = await getUsersAction();

  return (
    <div className="page-shell">
      <PageHeader
        title="Settings"
        description="Admin user management and team access"
      />

      <DataPanel title="Users" description="Team members and roles">
        <ul className="divide-y divide-border/60 p-2 md:p-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 rounded-lg px-3 py-3 transition-colors duration-150 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{user.name ?? user.email}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <RoleBadge role={user.role} />
            </li>
          ))}
        </ul>
      </DataPanel>
    </div>
  );
}
