import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { DebugClient } from "./debug-client";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const session = await auth();
  const adminEmail = process.env["ADMIN_EMAIL"];

  if (!adminEmail || !session?.user?.email || session.user.email !== adminEmail) {
    notFound();
  }

  return <DebugClient />;
}
