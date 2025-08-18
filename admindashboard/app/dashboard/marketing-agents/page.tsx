"use client";

import { FC, useContext, useState } from "react";
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
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  usersDeleteAgentMutation,
  usersListUsersOptions,
  usersReactivateUserMutation,
  usersSuspendUserMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { usersgrpcUser, usersgrpcUserStatus } from "@/client/users.swagger";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { ordersListTotalComissionAmountByReferrerOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { formatAmount, formatCurrency } from "@/utils";

interface MarketingAgentRowProp {
  agent: usersgrpcUser;
  handleViewDetails: (agentId: string | undefined) => void;
  handleEditAgent: (agent: usersgrpcUser) => void;
  handleDisableAgent: (agent: usersgrpcUser) => void;
  handleDelete: (agent: usersgrpcUser) => void;
}

const MarketingAgentRow: FC<MarketingAgentRowProp> = ({
  agent,
  handleViewDetails,
  handleEditAgent,
  handleDelete,
  handleDisableAgent,
}) => {
  const { user } = useContext(Context) as ContextType;

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

  const { data: commissions } = useQuery({
    ...ordersListTotalComissionAmountByReferrerOptions({
      path: {
        adminUserId: user?.userId ?? "",
        referrerId: agent?.userId ?? "",
      },
    }),
  });

  return (
    <TableRow key={agent?.userId}>
      <TableCell className="font-medium">
        {agent?.firstName} {agent?.lastName}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate max-w-[200px]">{agent?.email}</span>
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
          {agent.status?.replace("UserStatus_", "")}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">
          {commissions?.commissions?.length === 0 ? (
            <p>No due</p>
          ) : (
            <p>
              {commissions?.commissions
                ?.map((item) =>
                  formatCurrency(item.value ?? "0", item?.currencyIsoCode ?? "")
                )
                .join(" + ")}
            </p>
          )}
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
            onClick={() => handleDisableAgent(agent)}
            title={
              agent.status === "UserStatus_ACTIVE" ? "Deactivate" : "Activate"
            }
            className={
              agent?.status === "UserStatus_ACTIVE"
                ? "text-yellow-600"
                : "text-green-600"
            }
          >
            <UserX className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Delete Agent"
            className="text-red-600"
            onClick={() => handleDelete(agent)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const MarketingAgentCard: FC<MarketingAgentRowProp> = ({
  agent,
  handleViewDetails,
  handleEditAgent,
  // handleDelete,
  // handleDisableAgent,
}) => {
  const { user } = useContext(Context) as ContextType;

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

  const { data: commissions } = useQuery({
    ...ordersListTotalComissionAmountByReferrerOptions({
      path: {
        adminUserId: user?.userId ?? "",
        referrerId: agent?.userId ?? "",
      },
      query: {
        isPaid: false,
      },
    }),
  });
  return (
    <Card key={agent.userId} className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-medium">
              {agent.firstName} {agent.lastName}
            </h3>
            <Badge className={`${getStatusColor(agent.status)} mt-1`}>
              {agent.status?.replace("UserStatus_", "")}
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
            <strong>Unpaid:</strong>
            {commissions?.commissions?.length === 0 ? (
              <p>No due</p>
            ) : (
              <p>
                {commissions?.commissions
                  ?.map((item) =>
                    formatCurrency(
                      item.value ?? "0",
                      item?.currencyIsoCode ?? ""
                    )
                  )
                  .join(" + ")}
              </p>
            )}
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
            {agent.status === "UserStatus_ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default function MarketingAgentsPage() {
  const { user } = useContext(Context) as ContextType;

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<usersgrpcUser | undefined>();
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [suspendingAgent, setSuspendingAgent] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string>();
  const [deletingAgentName, setDeletingAgentName] = useState<string>();

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
    refetch();
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

  const handleDisableAgent = async (agent: usersgrpcUser | undefined) => {
    try {
      setSuspendingAgent(agent?.userId);
      setLoading(true);
      // const user = users.find((f) => f.id === userId);
      const newStatus =
        agent?.status === "UserStatus_SUSPENDED" ? "active" : "suspended";

      if (newStatus === "active") {
        await reactivateAccount({
          body: {},
          path: {
            userId: agent?.userId ?? "",
            adminUserId: user?.userId ?? "",
          },
        });
      } else {
        await suspendAccount({
          body: {},
          path: {
            userId: agent?.userId ?? "",
            adminUserId: user?.userId ?? "",
          },
        });
      }

      toast({
        title: `User account ${
          newStatus === "suspended" ? "disabled" : "enabled"
        }`,
        description: `${
          agent?.firstName ?? agent?.lastName ?? ""
        }'s account has been ${
          newStatus === "suspended" ? "suspended" : "reactivated"
        }.`,
      });

      refetch();
    } catch (error) {
      console.error({ error }, "changing account status");
    } finally {
      setSuspendingAgent(undefined);
      setLoading(false);
    }
  };

  const { mutateAsync: suspendAccount } = useMutation({
    ...usersSuspendUserMutation(),
    onError: (error) => {
      toast({
        title: `Error suspending account`,
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: reactivateAccount } = useMutation({
    ...usersReactivateUserMutation(),
    onError: (error) => {
      toast({
        title: `Error reactivating account`,
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (agent: usersgrpcUser) => {
    setDeletingAgentId(agent?.userId ?? "");
    setDeletingAgentName(agent?.firstName ?? agent?.lastName ?? "");
    confirmDelete?.openDialog();
  };

  // Confirm delete hook
  const confirmDelete = useConfirmDelete({
    onDelete: async () => {
      setLoading(true);
      if (deletingAgentId) {
        await deleteAgent({
          path: {
            adminUserId: user?.userId ?? "",
            userId: deletingAgentId ?? "",
          },
        });
      }
      setLoading(false);
    },
    itemType: deletingAgentName,
    description: "Are you sure you want to delete this agent?",
  });

  const { mutateAsync: deleteAgent } = useMutation({
    ...usersDeleteAgentMutation(),
    onSuccess: () => {
      toast({
        title: "Agent deleted",
        description: "Agent has been deleted successfully",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error deleting agent",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
        variant: "destructive",
      });
    },
  });

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
                <MarketingAgentCard
                  agent={agent}
                  key={agent?.userId}
                  handleDelete={() => handleDelete}
                  handleEditAgent={() => handleEditAgent(agent)}
                  handleDisableAgent={() => handleDisableAgent(agent)}
                  handleViewDetails={() => handleViewDetails(agent?.userId)}
                />
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
                    <MarketingAgentRow
                      agent={agent}
                      key={agent?.userId}
                      handleDelete={() => handleDelete}
                      handleEditAgent={() => handleEditAgent(agent)}
                      handleDisableAgent={() => handleDisableAgent(agent)}
                      handleViewDetails={() => handleViewDetails(agent?.userId)}
                    />
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

      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        itemName={deletingAgentName}
        isLoading={loading}
      />
    </div>
  );
}
