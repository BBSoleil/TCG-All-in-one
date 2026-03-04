"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeDeckAction, validateDeckAction } from "../actions";
import { formatPrice } from "@/shared/lib/format";
import type { DeckAnalysis, DeckValidationResult } from "../types";

export function DeckAnalysisPanel({ deckId }: { deckId: string }) {
  const [analysis, setAnalysis] = useState<DeckAnalysis | null>(null);
  const [validation, setValidation] = useState<DeckValidationResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAnalyze() {
    startTransition(async () => {
      const [aResult, vResult] = await Promise.all([
        analyzeDeckAction(deckId),
        validateDeckAction(deckId),
      ]);
      if (aResult.analysis) setAnalysis(aResult.analysis);
      if (vResult.validation) setValidation(vResult.validation);
    });
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleAnalyze} disabled={isPending} variant="outline">
        {isPending ? "Analyzing..." : analysis ? "Refresh Analysis" : "Analyze Deck"}
      </Button>

      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Legality Check
              <span className={`text-sm font-normal ${validation.valid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                {validation.valid ? "Valid" : "Invalid"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {validation.errors.map((e, i) => (
              <p key={i} className="text-sm text-destructive">{e}</p>
            ))}
            {validation.warnings.map((w, i) => (
              <p key={i} className="text-sm text-yellow-600">{w}</p>
            ))}
            {validation.errors.length === 0 && validation.warnings.length === 0 && (
              <p className="text-sm text-muted-foreground">No issues found.</p>
            )}
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{analysis.totalCards}</p>
                  <p className="text-xs text-muted-foreground">Main Deck</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysis.sideboardCards}</p>
                  <p className="text-xs text-muted-foreground">Sideboard</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatPrice(analysis.estimatedValue)}</p>
                  <p className="text-xs text-muted-foreground">Est. Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {analysis.costCurve.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Curve</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-1" style={{ height: "120px" }}>
                  {analysis.costCurve.map((point) => {
                    const maxCount = Math.max(...analysis.costCurve.map((p) => p.count));
                    const heightPct = maxCount > 0 ? (point.count / maxCount) * 100 : 0;
                    return (
                      <div key={point.cost} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">{point.count}</span>
                        <div
                          className="w-full rounded-t bg-primary"
                          style={{ height: `${heightPct}%`, minHeight: point.count > 0 ? "4px" : "0" }}
                        />
                        <span className="text-xs">{point.cost}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {analysis.typeBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Card Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.typeBreakdown.map((t) => (
                      <div key={t.type} className="flex items-center justify-between text-sm">
                        <span>{t.type}</span>
                        <span className="text-muted-foreground">{t.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {analysis.attributeBreakdown.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Colors / Attributes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.attributeBreakdown.map((a) => (
                      <div key={a.attribute} className="flex items-center justify-between text-sm">
                        <span>{a.attribute}</span>
                        <span className="text-muted-foreground">{a.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {analysis.rarityBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rarity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {analysis.rarityBreakdown.map((r) => (
                    <div key={r.rarity} className="rounded-md border border-border px-3 py-1 text-sm">
                      <span className="font-medium">{r.rarity}</span>
                      <span className="ml-1 text-muted-foreground">({r.count})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
