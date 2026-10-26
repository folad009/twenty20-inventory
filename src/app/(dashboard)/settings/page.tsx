import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { getUsersAction } from "@/server/actions/settings";
import { SettingsUsersClient } from "@/components/settings/settings-users-client";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== Role.ADMIN) {
    redirect("/");
  }

  const users = await getUsersAction();

  return (
    <SettingsUsersClient
      initialUsers={users}
      currentUserId={session.user.id}
    />
  );
}
