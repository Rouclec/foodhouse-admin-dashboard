"use client";

import type React from "react";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Flag,
  MessageCircle,
  Phone,
  Truck,
  Star,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  usersGrantAgent,
  usersgrpcUser,
  usersgrpcUserStatus,
} from "@/client/users.swagger";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  usersDeleteAgentMutation,
  usersGrantAgentMutation,
  usersListUsersOptions,
  usersReactivateUserMutation,
  usersSuspendUserMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { useQueryLoading } from "@/hooks/use-query-loading";
import moment from "moment";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const STATUS_FILTERS: Array<{
  label: string;
  value: usersgrpcUserStatus;
}> = [
  {
    label: "All Statuses",
    value: "UserStatus_UNSPECIFIED",
  },
  {
    label: "Active",
    value: "UserStatus_ACTIVE",
  },
  {
    label: "Suspended",
    value: "UserStatus_SUSPENDED",
  },
];

const coutryIsoCodes = ["CM", "TZ", "US"];

export default function AgentsPage() {
  const { user } = useContext(Context) as ContextType;
  const [suspendingAgent, setSuspendingAgent] = useState<string>();
  const [deletingAgentId, setDeletingAgentId] = useState<string>();
  const [deletingAgentName, setDeletingAgentName] = useState<string>();

  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<usersgrpcUserStatus>(
    "UserStatus_UNSPECIFIED"
  );
  const { toast } = useToast();

  const {
    data: usersData,
    isLoading: isUsersLoading,
    refetch,
  } = useQuery({
    ...usersListUsersOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
      query: {
        searchKey: searchTerm,
        startKey: "",
        userStatus: statusFilter,
        count: 1000000,
        userRole: "USER_ROLE_AGENT",
      },
    }),
    placeholderData: keepPreviousData,
  });

  useQueryLoading(isUsersLoading);

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    address: "",
    residenceCountryIsoCode: "CM",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create new agent
      setLoading(true);

      await createAgent({
        body: {
          phoneNumber: formData?.phone,
          residenceCountryIsoCode: formData.residenceCountryIsoCode,
          address: formData?.address ?? "",
          email: formData?.email ?? "",
        },
        path: {
          adminUserId: user?.userId ?? "",
        },
      });
      toast({
        title: "Agent created",
        description: "The new field agent has been successfully created.",
      });

      resetForm();
      refetch();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      phone: "",
      address: "",
      residenceCountryIsoCode: "CM",
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (agent: usersgrpcUser) => {
    setDeletingAgentId(agent?.userId ?? "");
    setDeletingAgentName(agent?.firstName ?? agent?.lastName ?? "");
    confirmDelete?.openDialog();
  };

  const handleContactViaWhatsApp = (phone: string, name: string) => {
    const message = encodeURIComponent(
      `Hello ${name}! I'm contacting you from FoodHouse admin team.`
    );
    const whatsappUrl = `https://wa.me/${phone.replace(
      /[^0-9]/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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

  const { mutateAsync: createAgent } = useMutation({
    ...usersGrantAgentMutation(),
    onError: (error) => {
      toast({
        title: "Error creating agent",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
        variant: "destructive",
      });
    },
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Field Agents</h1>
            <p className="text-gray-600">
              Manage field agents who validate products from farmers
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{"Create New Field Agent"}</DialogTitle>
                <DialogDescription>
                  {
                    "Add a new field agent who will validate products from farmers."
                  }
                </DialogDescription>
              </DialogHeader>
              <form
              // onSubmit={handleSubmit}
              >
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g., john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="e.g., +1234567890"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Address</Label>
                      <Input
                        id="location"
                        placeholder="e.g., Bamenda, Cameroon"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">
                        Residence country Iso Code
                      </Label>
                      <Select
                        value={formData.residenceCountryIsoCode}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            residenceCountryIsoCode: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {coutryIsoCodes.map((isoCode) => (
                            <SelectItem key={isoCode} value={isoCode}>
                              {isoCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`${
                      loading &&
                      "bg-gray-500 hover:bg-grey-500 hover:cursor-not-allowed bg-opacity-80"
                    }`}
                  >
                    {"Create Agent"}
                    {loading && (
                      <Loader2 className={"animate-spin text-white"} />
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="h-5 w-5 mr-2" />
              Field Agent Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, or email."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as usersgrpcUserStatus)
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter, index) => (
                    <SelectItem value={filter.value as string} key={index}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agents List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usersData?.users?.map((agent) => (
            <Card key={agent?.userId ?? ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Badge className={getStatusColor(agent?.status)}>
                    {agent?.status
                      ?.replace("UserStatus_", "")
                      .split("_")
                      .join(" ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center mb-4">
                  <Avatar className="h-12 w-12 mr-4">
                    {!!agent?.profileImage && (
                      <AvatarImage
                        src={agent?.profileImage}
                        alt={agent?.firstName ?? agent?.lastName ?? ""}
                      />
                    )}
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {(agent?.firstName ?? agent?.lastName ?? "A")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-lg">
                      {agent?.firstName} {agent?.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{agent.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span>{agent?.phoneNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 text-gray-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{agent?.address}</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 text-gray-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      Joined{" "}
                      {moment(agent?.createdAt ?? "").format("DD-MM-YYYY")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCall(agent?.phoneNumber ?? "")}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisableAgent(agent)}
                    className={
                      agent?.status === "UserStatus_ACTIVE"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    {agent?.status === "UserStatus_ACTIVE"
                      ? "Suspend"
                      : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleContactViaWhatsApp(
                        agent?.phoneNumber ?? "",
                        agent?.firstName ?? agent?.lastName ?? ""
                      )
                    }
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => handleDelete(agent)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usersData?.users?.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <ClipboardCheck className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No agents found</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                {searchTerm || statusFilter !== "UserStatus_UNSPECIFIED"
                  ? "Try adjusting your search or filter criteria"
                  : "Add your first field agent to get started"}
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Agent
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        itemName={deletingAgentName}
        isLoading={loading}
      />
    </>
  );
}
