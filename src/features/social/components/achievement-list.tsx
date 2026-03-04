import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicAchievement } from "../types";

export function AchievementList({
  achievements,
  title = "Achievements",
}: {
  achievements: PublicAchievement[];
  title?: string;
}) {
  if (achievements.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {achievements.map((a) => (
            <div
              key={a.code}
              className="flex items-start gap-3 rounded-md border border-border p-3"
            >
              <span className="text-2xl">{a.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.description}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Earned {new Date(a.earnedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
