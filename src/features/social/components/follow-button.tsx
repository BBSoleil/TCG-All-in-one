"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followAction, unfollowAction } from "../actions";

export function FollowButton({
  userId,
  isFollowing,
}: {
  userId: string;
  isFollowing: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      if (isFollowing) {
        await unfollowAction(userId);
      } else {
        await followAction(userId);
      }
    });
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
