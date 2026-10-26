"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import type { Role } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataPanel, DataTableShell } from "@/components/shared/data-panel";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { RoleBadge } from "@/components/shared/status-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createUserAction,
  deleteUserAction,
  getUsersAction,
  updateUserAction,
} from "@/server/actions/settings";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  createdAt: Date;
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  VIEWER: "Viewer",
};

export function SettingsUsersClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserRow[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [pending, setPending] = useState(false);

  async function refresh() {
    const next = await getUsersAction();
    setUsers(next);
  }

  async function handleSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "") as Role,
      ...(password ? { password } : {}),
    };

    setPending(true);
    const result = editing
      ? await updateUserAction({
          id: editing.id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          password: password || undefined,
        })
      : await createUserAction({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          password,
        });
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(editing ? "User updated" : "User created");
    setOpen(false);
    setEditing(null);
    await refresh();
  }

  async function handleDelete(user: UserRow) {
    const confirmed = window.confirm(`Delete ${user.name ?? user.email}?`);
    if (!confirmed) return;

    setPending(true);
    const result = await deleteUserAction(user.id);
    setPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("User deleted");
    await refresh();
  }

  const addUserButton = (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setEditing(null);
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Add user
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update name, email, role, or password."
              : "Create a team member who can sign in."}
          </DialogDescription>
        </DialogHeader>
        <form
          key={editing?.id ?? "new"}
          action={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={255}
                defaultValue={editing?.name ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={editing?.email ?? ""}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                required
                defaultValue={editing?.role ?? "VIEWER"}
                className="form-select"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required={!editing}
                minLength={editing ? undefined : 8}
                placeholder={editing ? "Leave blank to keep current" : undefined}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="page-shell">
      <PageHeader
        title="Settings"
        description="Admin user management and team access"
        actions={addUserButton}
      />

      <DataPanel title="Users" description={`${users.length} team members`}>
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users"
            description="Add a team member to give them access."
            action={addUserButton}
            className="m-4 border-0 bg-transparent"
          />
        ) : (
          <DataTableShell label="Users">
            <DataTable minWidth={720}>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="th-numeric">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name ?? "—"}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={ROLE_LABELS[user.role]} />
                    </TableCell>
                    <TableCell className="td-numeric">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  setEditing(user);
                                  setOpen(true);
                                }}
                              />
                            }
                          >
                            <Pencil />
                          </TooltipTrigger>
                          <TooltipContent>Edit user</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                disabled={user.id === currentUserId || pending}
                                onClick={() => handleDelete(user)}
                              />
                            }
                          >
                            <Trash2 />
                          </TooltipTrigger>
                          <TooltipContent>
                            {user.id === currentUserId
                              ? "You cannot delete your own account"
                              : "Delete user"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </DataTableShell>
        )}
      </DataPanel>
    </div>
  );
}
