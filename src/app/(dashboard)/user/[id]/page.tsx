import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { getPublicProfile, getPublicCollections, getUserName } from "@/features/social/services/profiles";
import { getFollowState } from "@/features/social/services/follows";
import { FollowButton, AchievementList } from "@/features/social/components";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GAME_LABELS } from "@/shared/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getUserName(id);
  const name = result.success ? result.data : "Collector";
  return {
    title: `${name} | TCG All-in-One`,
    description: `View ${name}'s TCG collection and achievements on TCG All-in-One.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  // Redirect to own profile page if viewing self
  if (id === session.user.id) {
    redirect("/profile");
  }

  const [profileResult, collectionsResult, followStateResult] = await Promise.all([
    getPublicProfile(id, session.user.id),
    getPublicCollections(id, session.user.id),
    getFollowState(session.user.id, id),
  ]);

  if (!profileResult.success) notFound();

  const profile = profileResult.data;
  const collections = collectionsResult.success ? collectionsResult.data : [];
  const followState = followStateResult.success ? followStateResult.data : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/social">
          <Button variant="ghost" size="sm">
            &larr; Back
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {profile.image ? (
                <div className="relative h-16 w-16 shrink-0">
                  <Image
                    src={profile.image}
                    alt={profile.name ?? "User"}
                    fill
                    sizes="64px"
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-bold">
                  {(profile.name ?? "?")[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {profile.name ?? "Anonymous"}
                </h1>
                {profile.bio && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.bio}
                  </p>
                )}
                <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                  <span>{profile.followerCount} followers</span>
                  <span>{profile.followingCount} following</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Joined {new Date(profile.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {followState && (
              <FollowButton
                userId={id}
                isFollowing={followState.isFollowing}
              />
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.collectionCount}</p>
              <p className="text-xs text-muted-foreground">Collections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.totalCards}</p>
              <p className="text-xs text-muted-foreground">Cards</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.achievements.length}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {collections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Public Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {collections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary">
                        {GAME_LABELS[c.gameType as keyof typeof GAME_LABELS] ?? c.gameType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {c.cardCount} card{c.cardCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Updated {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AchievementList achievements={profile.achievements} />
    </div>
  );
}
