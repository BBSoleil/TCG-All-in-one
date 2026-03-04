import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFollowing, getFollowers } from "@/features/social/services/follows";
import { getUserAchievements } from "@/features/social/services/achievements";
import { UserSearch, UserCard, AchievementList } from "@/features/social/components";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Social | TCG All-in-One",
  description: "Find collectors, follow users, and track achievements.",
};

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [followingResult, followersResult, achievementsResult] = await Promise.all([
    getFollowing(session.user.id, session.user.id),
    getFollowers(session.user.id, session.user.id),
    getUserAchievements(session.user.id),
  ]);

  const following = followingResult.success ? followingResult.data : [];
  const followers = followersResult.success ? followersResult.data : [];
  const achievements = achievementsResult.success ? achievementsResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Social</h1>
        <p className="text-muted-foreground">
          Discover collectors, follow friends, and earn achievements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Collectors</CardTitle>
        </CardHeader>
        <CardContent>
          <UserSearch />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Following ({following.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {following.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You&apos;re not following anyone yet. Search for collectors above.
              </p>
            ) : (
              <div className="space-y-2">
                {following.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Followers ({followers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {followers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No followers yet. Make your profile public to get discovered.
              </p>
            ) : (
              <div className="space-y-2">
                {followers.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AchievementList achievements={achievements} title="Your Achievements" />
    </div>
  );
}
