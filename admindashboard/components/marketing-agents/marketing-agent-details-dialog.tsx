"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, History } from "lucide-react";
import { formatCurrency } from "@/utils";

interface MarketingAgentDetails {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  referralCode: string;
  status: "active" | "inactive";
  createdAt: string;
  commissions: {
    currency: string;
    unpaidAmount: number;
    totalEarned: number;
    lastTransactionDate?: string;
  }[];
}

interface CommissionPayment {
  id: string;
  currency: string;
  amount: number;
  paidAt: string;
  transactionReference?: string;
}

interface MarketingAgentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
}

// Mock data
const mockAgentDetails: Record<string, MarketingAgentDetails> = {
  "1": {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    phoneNumber: "+1234567890",
    city: "New York",
    referralCode: "ABC1234",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    commissions: [
      {
        currency: "USD",
        unpaidAmount: 250.0,
        totalEarned: 1500.0,
        lastTransactionDate: "2024-01-20T10:00:00Z",
      },
      {
        currency: "EUR",
        unpaidAmount: 180.5,
        totalEarned: 890.5,
        lastTransactionDate: "2024-01-18T14:30:00Z",
      },
    ],
  },
  "2": {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phoneNumber: "+1234567891",
    city: "Los Angeles",
    referralCode: "DEF5678",
    status: "active",
    createdAt: "2024-01-20T14:30:00Z",
    commissions: [
      {
        currency: "USD",
        unpaidAmount: 0,
        totalEarned: 2200.0,
        lastTransactionDate: "2024-01-25T09:15:00Z",
      },
    ],
  },
  "3": {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@example.com",
    phoneNumber: "+1234567892",
    city: "Chicago",
    referralCode: "GHI9012",
    status: "inactive",
    createdAt: "2024-02-01T09:15:00Z",
    commissions: [
      {
        currency: "USD",
        unpaidAmount: 75.25,
        totalEarned: 325.75,
        lastTransactionDate: "2024-02-05T16:45:00Z",
      },
    ],
  },
};

const mockPaymentHistory: Record<string, CommissionPayment[]> = {
  "1": [
    {
      id: "1",
      currency: "USD",
      amount: 500.0,
      paidAt: "2024-01-10T10:00:00Z",
      transactionReference: "PAY-1704873600000",
    },
    {
      id: "2",
      currency: "EUR",
      amount: 300.0,
      paidAt: "2024-01-12T14:30:00Z",
      transactionReference: "PAY-1705060200000",
    },
  ],
  "2": [
    {
      id: "3",
      currency: "USD",
      amount: 1200.0,
      paidAt: "2024-01-15T09:15:00Z",
      transactionReference: "PAY-1705309300000",
    },
    {
      id: "4",
      currency: "USD",
      amount: 1000.0,
      paidAt: "2024-01-22T11:45:00Z",
      transactionReference: "PAY-1705914300000",
    },
  ],
  "3": [
    {
      id: "5",
      currency: "USD",
      amount: 150.5,
      paidAt: "2024-01-28T16:20:00Z",
      transactionReference: "PAY-1706459200000",
    },
  ],
};

export function MarketingAgentDetailsDialog({
  isOpen,
  onClose,
  agentId,
}: MarketingAgentDetailsDialogProps) {
  const [payingCommission, setPayingCommission] = useState<string | null>(null);
  const { toast } = useToast();

  const agent = mockAgentDetails[agentId];
  const paymentHistory = mockPaymentHistory[agentId] || [];

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

  const handlePayCommission = async (currency: string, amount: number) => {
    setPayingCommission(currency);

    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Commission Paid",
        description: `Successfully paid ${formatCurrency(
          amount,
          currency
        )} commission.`,
      });

      // In a real app, you would update the data here
      console.log(`Paid ${amount} ${currency} to agent ${agentId}`);
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Failed to process commission payment. Please try again.",
        variant: "destructive",
      });
      console.error("Pay commission error:", error);
    } finally {
      setPayingCommission(null);
    }
  };

  if (!agent) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex items-center justify-center p-8">
            <div>Agent not found</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {agent.name} - Marketing Agent Details
          </DialogTitle>
          <DialogDescription>
            Referral Code:{" "}
            <Badge variant="outline" className="font-mono">
              {agent.referralCode}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p>{agent.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p>{agent.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    City
                  </p>
                  <p>{agent.city}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="commissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="commissions">Commission Overview</TabsTrigger>
              <TabsTrigger value="history">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="commissions" className="space-y-4">
              {/* Commission Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {agent.commissions?.map((commission) => (
                  <Card key={commission.currency}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {commission.currency}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(
                              commission.unpaidAmount,
                              commission.currency
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Unpaid Commission
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(
                              commission.totalEarned,
                              commission.currency
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total Earned
                          </p>
                        </div>
                        {commission.lastTransactionDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Last transaction:{" "}
                              {new Date(
                                commission.lastTransactionDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {commission.unpaidAmount > 0 && (
                          <Button
                            size="sm"
                            className="w-full mt-2"
                            onClick={() =>
                              handlePayCommission(
                                commission.currency,
                                commission.unpaidAmount
                              )
                            }
                            disabled={payingCommission === commission.currency}
                          >
                            {payingCommission === commission.currency
                              ? "Processing..."
                              : "Pay Commission"}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(!agent.commissions || agent.commissions.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No commissions earned yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentHistory && paymentHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Reference</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentHistory.map((payment: CommissionPayment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.paidAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {payment.currency}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(payment.amount, payment.currency)}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.transactionReference || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No payment history found
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
