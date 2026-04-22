import { db } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { UsersListClient } from "./users-list-client";

export const dynamic = "force-dynamic";

async function getAllUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      university: users.university,
      department: users.department,
      level: users.level,
      profileImage: users.profileImage,
      verificationStatus: users.verificationStatus,
      isBanned: users.isBanned,
      isSuspended: users.isSuspended,
      warningCount: users.warningCount,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export default async function UsersPage() {
  const allUsers = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">All Users</h1>
        <p className="text-sm text-zinc-400 mt-1">
          {allUsers.length} registered user{allUsers.length !== 1 ? "s" : ""}
        </p>
      </div>
      <UsersListClient users={allUsers} />
    </div>
  );
}
