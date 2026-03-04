import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "./follow-button";

export function UserCard({
  user,
  showFollowButton = true,
}: {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    followerCount: number;
    isFollowing: boolean;
  };
  showFollowButton?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/user/${user.id}`}
            className="text-sm font-medium hover:underline"
          >
            {user.name ?? "Anonymous"}
          </Link>
          {user.bio && (
            <p className="truncate text-xs text-muted-foreground">{user.bio}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {user.followerCount} follower{user.followerCount !== 1 ? "s" : ""}
          </p>
        </div>
        {showFollowButton && (
          <FollowButton userId={user.id} isFollowing={user.isFollowing} />
        )}
      </CardContent>
    </Card>
  );
}
