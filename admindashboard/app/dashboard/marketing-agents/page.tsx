"use client";

import { useContext, useState } from "react";
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
import { Edit, Trash2, Eye, UserX, Mail, Phone, Plus } from "lucide-react";
import { MarketingAgentDetailsDialog } from "@/components/marketing-agents/marketing-agent-details-dialog";
import { CreateMarketingAgentDialog } from "@/components/marketing-agents/create-marketing-agent-dialog";
import { useToast } from "@/hooks/use-toast";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usersListUsersOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { usersgrpcUser, usersgrpcUserStatus } from "@/client/users.swagger";
import { CursorPagination } from "@/components/ui/cursor-pagination";

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

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

export default function MarketingAgentsPage() {
  const { user } = useContext(Context) as ContextType;

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<usersgrpcUser | undefined>();
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  const { toast } = useToast();

  const pagination = useCursorPagination({
    initialStartKey: "",
    pageSize: 10,
  });

  const {
    data: agentsData,
    isLoading: isAgentsLoading,
    refetch,
  } = useQuery({
    ...usersListUsersOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
      query: {
        count: pagination.pageSize,
        search: "",
        startKey: pagination.startKey,
        userRole: "USER_ROLE_MARKETING_AGENT",
        userStatus: "UserStatus_UNSPECIFIED",
      },
    }),
    placeholderData: keepPreviousData,
  });

  useQueryLoading(isAgentsLoading);

  const handleViewDetails = (agentId: string | undefined) => {
    if (!agentId) return;
    setSelectedAgentId(agentId);
    setShowDetailsDialog(true);
  };

  const handleCreateAgent = () => {
    setEditingAgent(undefined); // Clear any previous editing agent
    setDialogMode("create");
    setIsCreateEditOpen(true);
  };

  const handleEditAgent = (agent: usersgrpcUser) => {
    setEditingAgent(agent);
    setDialogMode("edit");
    setIsCreateEditOpen(true);
  };

  const handleCloseCreateEdit = () => {
    setEditingAgent(undefined);
    setDialogMode("create");
    setIsCreateEditOpen(false);
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

  const getStatusColor = (status: usersgrpcUserStatus | undefined) => {
    switch (status) {
      case "UserStatus_ACTIVE":
        return "bg-green-100 text-green-800";
      case "UserStatus_SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleNextPage = () => {
    // Only proceed if nextKey exists and is not empty
    if (agentsData?.nextKey && agentsData.nextKey !== "") {
      pagination.goToNextPage(agentsData.nextKey.toString());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Marketing Agents
          </h1>
          <p className="text-muted-foreground">
            Manage your marketing agents, track their commissions, and process
            payments.
          </p>
        </div>
        <Button onClick={handleCreateAgent} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Marketing Agent
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mobile/Tablet Card View */}
            <div className="block lg:hidden space-y-4">
              {agentsData?.users?.map((agent: usersgrpcUser) => (
                <Card key={agent.userId} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">
                          {agent.firstName} {agent.lastName}
                        </h3>
                        <Badge
                          className={`${getStatusColor(agent.status)} mt-1`}
                        >
                          {agent.status}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {agent.referralCode}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{agent.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span>{agent.phoneNumber}</span>
                      </div>
                      <div className="text-muted-foreground">
                        <strong>City:</strong> {agent.address}
                      </div>
                      <div className="text-muted-foreground">
                        <strong>Unpaid:</strong>{" "}
                        {/* {getTotalUnpaidCommission(agent.totalCommissions)} */}
                        0
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(agent.userId)}
                        className="flex-1 min-w-0"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAgent(agent)}
                        className="flex-1 min-w-0"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 min-w-0 bg-transparent"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        {agent.status === "UserStatus_ACTIVE"
                          ? "Deactivate"
                          : "Activate"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Unpaid Commission</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentsData?.users?.map((agent: usersgrpcUser) => (
                    <TableRow key={agent?.userId}>
                      <TableCell className="font-medium">
                        {agent?.firstName} {agent?.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate max-w-[200px]">
                              {agent?.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {agent?.phoneNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{agent.address}</TableCell>
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
                          {/* {getTotalUnpaidCommission(agent.totalCommissions)} */}
                          0
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(agent.userId)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Edit Agent"
                            onClick={() => handleEditAgent(agent)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title={
                              agent.status === "UserStatus_ACTIVE"
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
            </div>

            {agentsData?.users?.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No marketing agents found
                </p>
              </div>
            )}
            <CursorPagination
              currentPage={pagination.currentPage}
              nextKey={agentsData?.nextKey?.toString()} // Pass the nextKey directly
              canGoToPrevious={pagination.canGoToPrevious}
              onPreviousPage={pagination.goToPreviousPage}
              onNextPage={handleNextPage}
              onFirstPage={pagination.goToFirstPage}
              isLoading={isAgentsLoading}
              itemsPerPage={pagination.pageSize}
              totalItemsOnPage={agentsData?.users?.length ?? 0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <CreateMarketingAgentDialog
        defaultValues={
          dialogMode === "edit" && editingAgent
            ? {
                id: editingAgent.userId,
                name: `${editingAgent.firstName} ${editingAgent.lastName}`,
                email: editingAgent.email,
                phoneNumber: editingAgent.phoneNumber,
                city: editingAgent.address,
              }
            : undefined
        }
        isOpen={isCreateEditOpen}
        setIsOpen={setIsCreateEditOpen}
        onClose={handleCloseCreateEdit}
        mode={dialogMode}
      />

      {/* Details Dialog */}
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
