"use client";

import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import {
  ordersListUserSubscriptionsOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { ordersgrpcUserSubscription } from "@/client/orders.swagger";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { formatCurrency } from "@/utils";
import moment from "moment";
import { useRouter } from "next/navigation";

// Get all users first - this is a simplified approach
// In production, you'd want a better way to list all active subscriptions
export default function ActiveSubscriptionsPage() {
  const { user } = useContext(Context) as ContextType;
  const router = useRouter();
  const { toast } = useToast();

  // TODO: Add an endpoint to list all active subscriptions across all users
  // For now, this is a placeholder that would need to be implemented
  // You could create an admin endpoint like ListAllActiveSubscriptions
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Active Subscriptions
          </h1>
          <p className="text-gray-600">
            View and track all active user subscriptions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Active Subscriptions Overview
          </CardTitle>
          <CardDescription>
            Track subscription progress and delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              This feature requires an admin endpoint to list all active subscriptions.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              TODO: Add ListAllActiveSubscriptions RPC endpoint
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

