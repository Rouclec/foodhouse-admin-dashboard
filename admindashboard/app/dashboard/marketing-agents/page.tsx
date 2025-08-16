"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, UserX, Mail, Phone } from "lucide-react";
import { MarketingAgentDetailsDialog } from "@/components/marketing-agents/marketing-agent-details-dialog";
import { CreateMarketingAgentDialog } from "@/components/marketing-agents/create-marketing-agent-dialog";
import { formatCurrency } from "@/utils";

interface MarketingAgent {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  referralCode: string;
  status: "active" | "inactive";
  createdAt: string;
  totalCommissions: {
    currency: string;
    unpaidAmount: number;
    totalEarned: number;
  }[];
}

// Mock data for demonstration
const mockMarketingAgents: MarketingAgent[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phoneNumber: "+1234567890",
    city: "New York",
    referralCode: "ABC1234",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    totalCommissions: [
      { currency: "USD", unpaidAmount: 250.0, totalEarned: 1500.0 },
      { currency: "EUR", unpaidAmount: 180.5, totalEarned: 890.5 },
    ],
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phoneNumber: "+1234567891",
    city: "Los Angeles",
    referralCode: "DEF5678",
    status: "active",
    createdAt: "2024-01-20T14:30:00Z",
    totalCommissions: [
      { currency: "USD", unpaidAmount: 0, totalEarned: 2200.0 },
    ],
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@example.com",
    phoneNumber: "+1234567892",
    city: "Chicago",
    referralCode: "GHI9012",
    status: "inactive",
    createdAt: "2024-02-01T09:15:00Z",
    totalCommissions: [
      { currency: "USD", unpaidAmount: 75.25, totalEarned: 325.75 },
    ],
  },
];

export default function MarketingAgentsPage() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [agents] = useState<MarketingAgent[]>(mockMarketingAgents);

  const handleViewDetails = (agentId: string) => {
    setSelectedAgentId(agentId);
    setShowDetailsDialog(true);
  };

  const getTotalUnpaidCommission = (
    commissions: MarketingAgent["totalCommissions"]
  ) => {
    if (!commissions || commissions.length === 0) return "No commissions";

    const unpaidCommissions = commissions.filter((c) => c.unpaidAmount > 0);
    if (unpaidCommissions.length === 0) return "All paid";

    return unpaidCommissions
      .map((c) => formatCurrency(c.unpaidAmount, c.currency))
      .join(" + ");
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing Agents</h1>
        <p className="text-muted-foreground">
          Manage your marketing agents, track their commissions, and process
          payments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Marketing Agents</CardTitle>
            <CreateMarketingAgentDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Unpaid Commission</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent: MarketingAgent) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {agent.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {agent.phoneNumber}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{agent.city}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {agent.referralCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {getTotalUnpaidCommission(agent.totalCommissions)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(agent.id)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" title="Edit Agent">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title={
                            agent.status === "active"
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Delete Agent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {agents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No marketing agents found
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedAgentId && (
        <MarketingAgentDetailsDialog
          isOpen={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedAgentId(null);
          }}
          agentId={selectedAgentId}
        />
      )}
    </div>
  );
}
