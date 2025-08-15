"use client"

import { MarketingAgentsTable } from "@/components/marketing-agents/marketing-agents-table"


export default function MarketingAgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing Agents</h1>
        <p className="text-muted-foreground">
          Manage your marketing agents, track their commissions, and process payments.
        </p>
      </div>
      <MarketingAgentsTable />
    </div>
  )
}
