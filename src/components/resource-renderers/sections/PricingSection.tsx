// src/components/resource-renderers/sections/PricingSection.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Gift, Info } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  best_for?: string;
  annual_cost?: string;
  recommended?: boolean;
}

interface PricingSectionProps {
  text?: string;
  plans?: PricingPlan[];
  free_features?: string[];
  discounts?: string[];
  insurance?: string;
}

export function PricingSection({
  text,
  plans,
  free_features,
  discounts,
  insurance
}: PricingSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Cost & Subscription</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {text && (
          <p className="text-sm text-label-primary">{text}</p>
        )}

        {/* Pricing Plans */}
        {plans && plans.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-lg border-2 p-4 ${
                  plan.recommended
                    ? "border-accent bg-accent-tint"
                    : "border-separator bg-surface"
                }`}
              >
                {plan.recommended && (
                  <Badge className="absolute -top-3 left-4 bg-accent">
                    Recommended
                  </Badge>
                )}
                <div className="mb-2">
                  <h4 className="text-lg font-bold text-label-primary">{plan.name}</h4>
                  <p className="text-2xl font-bold text-accent">{plan.price}</p>
                </div>
                {plan.best_for && (
                  <p className="mb-2 text-sm text-label-primary">{plan.best_for}</p>
                )}
                {plan.annual_cost && (
                  <p className="text-xs text-label-primary0">
                    Annual cost: {plan.annual_cost}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Free Features */}
        {free_features && free_features.length > 0 && (
          <div className="rounded-lg border border-positive-border bg-positive-tint p-4">
            <div className="mb-2 flex items-center gap-2">
              <Gift className="h-5 w-5 text-positive-700" />
              <h4 className="font-semibold text-green-900">Free Features</h4>
            </div>
            <ul className="space-y-1">
              {free_features.map((feature, i) => (
                <li key={i} className="text-sm text-green-800">
                  • {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Discounts */}
        {discounts && discounts.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold text-label-primary">Discounts Available</h4>
            <ul className="space-y-1">
              {discounts.map((discount, i) => (
                <li key={i} className="text-sm text-label-primary">
                  • {discount}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Insurance Note */}
        {insurance && (
          <div className="rounded-lg border border-accent-border bg-accent-tint p-3">
            <div className="mb-1 flex items-center gap-2">
              <Info className="h-4 w-4 text-accent-700" />
              <h5 className="text-sm font-semibold text-accent-700">Insurance</h5>
            </div>
            <p className="text-sm text-accent-700">{insurance}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
