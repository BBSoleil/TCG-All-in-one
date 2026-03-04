import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center">
      {Icon && (
        <Icon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
      )}
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {action && (
        <Link href={action.href} className="mt-4 inline-block">
          <Button variant="outline">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}
