"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { searchUsersAction } from "../actions";
import { FollowButton } from "./follow-button";

interface SearchResult {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  followerCount: number;
  isFollowing: boolean;
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    startTransition(async () => {
      const res = await searchUsersAction(query.trim());
      if (res.users) {
        setResults(res.users);
      }
      setSearched(true);
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search users by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !query.trim()}>
          {isPending ? "Searching..." : "Search"}
        </Button>
      </form>

      {searched && results.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No public users found matching &quot;{query}&quot;.
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/user/${user.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {user.name ?? "Anonymous"}
                  </Link>
                  {user.bio && (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.bio}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {user.followerCount} follower{user.followerCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <FollowButton userId={user.id} isFollowing={user.isFollowing} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
