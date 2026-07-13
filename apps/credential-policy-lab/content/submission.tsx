import { Card, CardContent, CardHeader, CardTitle } from "@world-lisbon/demo-ui";

import { TRUST_EVENT_QUESTION } from "../lib/policy-catalog";

export function SubmissionTemplate() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Useful trust-event submission question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-medium leading-6">{TRUST_EVENT_QUESTION}</p>
        <div className="grid gap-3 text-sm text-muted-foreground xl:grid-cols-3">
          <p><strong className="text-foreground">Event:</strong> Name the product action.</p>
          <p><strong className="text-foreground">Abuse:</strong> Explain the failure without trust.</p>
          <p><strong className="text-foreground">Assurance:</strong> Justify the minimum credential.</p>
        </div>
      </CardContent>
    </Card>
  );
}
