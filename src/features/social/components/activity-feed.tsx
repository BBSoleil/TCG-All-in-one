import Link from "next/link";
import {
  Plus,
  ShoppingCart,
  Trophy,
  UserPlus,
  ArrowLeftRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActivityEvent } from "@/features/social/services/activity-feed";

const EVENT_ICONS: Record<ActivityEvent["type"], React.ReactNode> = {
  card_added: <Plus className="h-3.5 w-3.5 text-emerald-500" />,
  new_listing: <ShoppingCart className="h-3.5 w-3.5 text-blue-500" />,
  trade_completed: <ArrowLeftRight className="h-3.5 w-3.5 text-yellow-500" />,
  achievement_earned: <Trophy className="h-3.5 w-3.5 text-amber-500" />,
  new_follower: <UserPlus className="h-3.5 w-3.5 text-purple-500" />,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ActivityFeed({
  events,
  title = "Activity Feed",
  compact = false,
}: {
  events: ActivityEvent[];
  title?: string;
  compact?: boolean;
}) {
  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No recent activity. Follow other collectors to see their updates here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayEvents = compact ? events.slice(0, 8) : events;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayEvents.map((event) => (
            <div key={event.id} className="flex items-start gap-3">
              {/* Avatar or icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                {event.actorImage ? (
                  <img
                    src={event.actorImage}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  EVENT_ICONS[event.type]
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <Link
                    href={`/user/${event.actorId}`}
                    className="font-medium hover:underline"
                  >
                    {event.actorName}
                  </Link>{" "}
                  <span className="text-muted-foreground">{event.description}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(event.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
