"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
      try {
        const result = isFollowing
          ? await unfollowAction(userId)
          : await followAction(userId);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(isFollowing ? "Unfollowed" : "Following!");
        }
      } catch {
        toast.error("Something went wrong");
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
