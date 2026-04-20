import Link from "next/link";

/**
 * Toggle between "All languages" (null) and a specific language the user
 * already owns in this set. Link-based, so it works with full SSR and
 * bookmarkable URLs (?lang=EN).
 */
export function LanguageFilter({
  available,
  active,
  basePath,
}: {
  available: string[];
  active: string | null;
  basePath: string;
}) {
  const options = ["ALL", ...available];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Track in:</span>
      {options.map((lang) => {
        const isActive = (lang === "ALL" && !active) || lang === active;
        const href = lang === "ALL" ? basePath : `${basePath}?lang=${lang}`;
        return (
          <Link
            key={lang}
            href={href}
            className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {lang === "ALL" ? "All languages" : lang}
          </Link>
        );
      })}
    </div>
  );
}
