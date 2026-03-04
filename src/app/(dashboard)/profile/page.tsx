import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";
import { ProfileForm } from "@/features/auth/components";
import { ProfileVisibilityToggle, AchievementList } from "@/features/social/components";
import { getUserAchievements } from "@/features/social/services/achievements";
import { getUserTier } from "@/features/billing/services";
import { BillingSection } from "./billing-section";
import { BioForm } from "./bio-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Profile Settings | TCG All-in-One",
  description: "Update your profile, privacy settings, and account details.",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [user, achievementsResult, tierResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPublic: true, bio: true },
    }),
    getUserAchievements(session.user.id),
    getUserTier(session.user.id),
  ]);
  const tier = tierResult.success ? tierResult.data.tier : "free";

  const achievements = achievementsResult.success ? achievementsResult.data : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>
            Update your name and profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-1">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{session.user.email}</p>
          </div>
          <ProfileForm name={session.user.name ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bio</CardTitle>
          <CardDescription>
            Tell other collectors about yourself
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BioForm bio={user?.bio ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profile Visibility</CardTitle>
            <CardDescription>
              {user?.isPublic
                ? "Your profile is public. Other users can find and view it."
                : "Your profile is private. Only you can see it."}
            </CardDescription>
          </div>
          <ProfileVisibilityToggle isPublic={user?.isPublic ?? false} />
        </CardHeader>
      </Card>

      <BillingSection tier={tier} />

      <AchievementList achievements={achievements} title="Your Achievements" />
    </div>
  );
}
