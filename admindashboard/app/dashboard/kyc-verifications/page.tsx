"use client";

import React, { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Search,
  Image as ImageIcon,
  FileText,
  MessageCircle,
  ExternalLink,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  usersgrpcKYCStatus,
  usersgrpcKYCVerification,
  usersgrpcUser,
} from "@/client/users.swagger";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import {
  usersGetUserByIdOptions,
  usersListKycVerificationsOptions,
  usersUpdateKycStatusMutation,
} from "@/client/users.swagger/@tanstack/react-query.gen";
import { useQueryLoading } from "@/hooks/use-query-loading";
import moment from "moment";
import Image from "next/image";

const STATUS_FILTERS: Array<{
  label: string;
  value: usersgrpcKYCStatus | "ALL";
}> = [
  { label: "All Statuses", value: "ALL" },
  { label: "Pending", value: "KYC_STATUS_PENDING" },
  { label: "Verified", value: "KYC_STATUS_VERIFIED" },
  { label: "Rejected", value: "KYC_STATUS_REJECTED" },
];

export default function KYCVerificationsPage() {
  const { user } = useContext(Context) as ContextType;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<usersgrpcKYCStatus | "ALL">("ALL");
  const [selectedVerification, setSelectedVerification] = useState<usersgrpcKYCVerification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    title?: string;
  } | null>(null);
  const { toast } = useToast();

  const {
    data: kycData,
    isLoading,
    refetch,
  } = useQuery({
    ...usersListKycVerificationsOptions({
      path: {
        adminUserId: user?.userId ?? "",
      },
      query: {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        searchKey: searchTerm || undefined,
      },
    }),
    placeholderData: keepPreviousData,
    enabled: !!user?.userId,
  });

  useQueryLoading(isLoading);

  const kycVerifications = kycData?.kycVerifications ?? [];

  const userIds = React.useMemo(() => {
    const ids = kycVerifications
      .map((k) => k.userId)
      .filter((id): id is string => !!id);
    return Array.from(new Set(ids));
  }, [kycVerifications]);

  const userQueries = useQueries({
    queries: userIds.map((userId) => ({
      ...usersGetUserByIdOptions({
        path: { userId },
      }),
      enabled: !!user?.userId && !!userId,
      staleTime: 60_000,
    })),
  });

  const userById = React.useMemo(() => {
    const map: Record<string, usersgrpcUser> = {};
    userQueries.forEach((q, idx) => {
      const id = userIds[idx];
      if (!id) return;
      const u = q.data?.user;
      if (u) map[id] = u;
    });
    return map;
  }, [userQueries, userIds]);

  const selectedUser = selectedVerification?.userId
    ? userById[selectedVerification.userId]
    : undefined;

  const getUserDisplayName = (u?: usersgrpcUser, fallbackId?: string) => {
    const fullName = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
    return fullName || u?.email || u?.phoneNumber || fallbackId || "Unknown user";
  };

  const toWhatsAppPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace(/[^\d]/g, "");
  };

  const isPdfUrl = (url?: string) => {
    if (!url) return false;
    const clean = url.split("?")[0] ?? url;
    return clean.toLowerCase().endsWith(".pdf");
  };

  const getFilenameFromUrl = (url?: string) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      const pathname = u.pathname ?? "";
      const last = pathname.split("/").filter(Boolean).pop() ?? "";
      return decodeURIComponent(last);
    } catch {
      const clean = (url.split("?")[0] ?? url).split("#")[0] ?? url;
      const last = clean.split("/").filter(Boolean).pop() ?? "";
      try {
        return decodeURIComponent(last);
      } catch {
        return last;
      }
    }
  };

  const IdentityDocsSection = (props: { urls?: string[] }) => {
    const urls = props.urls?.filter(Boolean) ?? [];
    const front = urls[0];
    const back = urls[1];
    const items: Array<{ label: string; url?: string }> = [
      { label: "Front", url: front },
      { label: "Back", url: back },
    ];

    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.label} className="space-y-2">
            <p className="text-xs font-medium text-gray-600">{it.label}</p>
            <div className="border rounded-lg p-2 bg-gray-50">
              {it.url ? (
                <button
                  type="button"
                  className="relative h-40 w-full bg-gray-100 rounded overflow-hidden group"
                  onClick={() =>
                    setExpandedImage({
                      url: it.url!,
                      title: `Identity document (${it.label})`,
                    })
                  }
                >
                  <Image
                    src={it.url}
                    alt={`Identity Document ${it.label}`}
                    fill
                    className="object-contain"
                  />
                  <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-md p-1">
                    <ExternalLink className="h-4 w-4 text-gray-700" />
                  </span>
                </button>
              ) : (
                <div className="h-40 flex items-center justify-center bg-gray-100 rounded">
                  <p className="text-sm text-gray-500">Not provided</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ExpandableImagePreview = (props: {
    url?: string;
    alt: string;
    title?: string;
  }) => {
    if (!props.url) {
      return (
        <div className="h-40 flex items-center justify-center bg-gray-100 rounded">
          <p className="text-sm text-gray-500">Not provided</p>
        </div>
      );
    }

    return (
      <button
        type="button"
        className="relative h-40 w-full bg-gray-100 rounded overflow-hidden group"
        onClick={() =>
          setExpandedImage({ url: props.url!, title: props.title ?? props.alt })
        }
      >
        <Image src={props.url} alt={props.alt} fill className="object-contain" />
        <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-md p-1">
          <ExternalLink className="h-4 w-4 text-gray-700" />
        </span>
      </button>
    );
  };

  const getStatusColor = (status: usersgrpcKYCStatus | undefined) => {
    switch (status) {
      case "KYC_STATUS_PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "KYC_STATUS_VERIFIED":
        return "bg-green-100 text-green-800";
      case "KYC_STATUS_REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: usersgrpcKYCStatus | undefined) => {
    switch (status) {
      case "KYC_STATUS_PENDING":
        return <Clock className="h-4 w-4" />;
      case "KYC_STATUS_VERIFIED":
        return <CheckCircle className="h-4 w-4" />;
      case "KYC_STATUS_REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: usersgrpcKYCStatus | undefined) => {
    switch (status) {
      case "KYC_STATUS_PENDING":
        return "Pending";
      case "KYC_STATUS_VERIFIED":
        return "Verified";
      case "KYC_STATUS_REJECTED":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const handleViewDetails = (verification: usersgrpcKYCVerification) => {
    setSelectedVerification(verification);
    setRejectionReason(verification.rejectionReason ?? "");
    setShowDetailModal(true);
  };

  const getBackendErrorMessage = (error: unknown) => {
    const err = error as any;
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      undefined
    );
  };

  const { mutateAsync: updateStatus } = useMutation({
    ...usersUpdateKycStatusMutation(),
  });

  const handleApprove = async () => {
    if (!selectedVerification) return;

    setActionLoading(true);
    try {
      await updateStatus({
        path: {
          adminUserId: user?.userId ?? "",
          kycId: selectedVerification.id ?? "",
        },
        body: {
          status: "KYC_STATUS_VERIFIED",
        },
      });
      toast({
        title: "KYC Approved",
        description: "The agent's KYC has been verified successfully.",
      });
      setShowDetailModal(false);
      refetch();
    } catch (error) {
      const backendMessage = getBackendErrorMessage(error);
      toast({
        title: "Error",
        description: backendMessage ?? "Failed to approve KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVerification) return;

    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this KYC.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      await updateStatus({
        path: {
          adminUserId: user?.userId ?? "",
          kycId: selectedVerification.id ?? "",
        },
        body: {
          status: "KYC_STATUS_REJECTED",
          rejectionReason: rejectionReason,
        },
      });
      toast({
        title: "KYC Rejected",
        description: "The agent has been notified about the rejection.",
      });
      setShowDetailModal(false);
      refetch();
    } catch (error) {
      const backendMessage = getBackendErrorMessage(error);
      toast({
        title: "Error",
        description: backendMessage ?? "Failed to reject KYC. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8" />
            KYC Verifications
          </h1>
          <p className="text-gray-600">
            Review and verify agent identity documents
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as usersgrpcKYCStatus | "ALL")
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter, index) => (
                  <SelectItem value={filter.value} key={index}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{kycData?.total ?? 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold">
                  {kycData?.kycVerifications?.filter(
                    (k) => k.status === "KYC_STATUS_PENDING"
                  ).length ?? 0}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold">
                  {kycData?.kycVerifications?.filter(
                    (k) => k.status === "KYC_STATUS_VERIFIED"
                  ).length ?? 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KYC List */}
      <Card>
        <CardHeader>
          <CardTitle>Agent KYC Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {kycData?.kycVerifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6">
              <div className="rounded-full bg-gray-100 p-3 mb-4">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No KYC verifications found</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                {searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter criteria"
                  : "No agents have submitted KYC documents yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {kycData?.kycVerifications?.map((kyc) => (
                <div
                  key={kyc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={kyc.selfieUrl ?? ""} alt="Agent" />
                      <AvatarFallback className="bg-primary text-white">
                        {getUserDisplayName(userById[kyc.userId ?? ""], kyc.userId)?.[0]?.toUpperCase() ??
                          "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {getUserDisplayName(userById[kyc.userId ?? ""], kyc.userId)}
                      </p>
                      <p className="text-xs text-gray-500">User ID: {kyc.userId}</p>
                      <p className="text-sm text-gray-500">
                        Submitted: {moment(kyc.createdAt).format("DD-MM-YYYY HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(kyc.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(kyc.status)}
                        {getStatusLabel(kyc.status)}
                      </span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(kyc)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KYC Verification Review</DialogTitle>
            <DialogDescription>
              Review the agent&apos;s identity documents before approving or rejecting
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <Badge className={getStatusColor(selectedVerification.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(selectedVerification.status)}
                      {getStatusLabel(selectedVerification.status)}
                    </span>
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">User</p>
                  <p className="font-medium">
                    {getUserDisplayName(selectedUser, selectedVerification.userId)}
                  </p>
                  <p className="text-xs text-gray-500">{selectedVerification.userId}</p>
                </div>
              </div>

              {/* Review card actions */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedUser?.profileImage ?? selectedVerification.selfieUrl ?? ""}
                      alt="User"
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {getUserDisplayName(selectedUser, selectedVerification.userId)?.[0]?.toUpperCase() ??
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {getUserDisplayName(selectedUser, selectedVerification.userId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedUser?.phoneNumber ?? selectedUser?.email ?? ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!toWhatsAppPhone(selectedUser?.phoneNumber)}
                    onClick={() => {
                      const phone = toWhatsAppPhone(selectedUser?.phoneNumber);
                      if (!phone) return;
                      window.open(`https://wa.me/${phone}`, "_blank");
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Identity Document */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Identity Document (Front/Back)
                    </Label>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      <IdentityDocsSection
                        urls={
                          selectedVerification.identityDocumentUrls ??
                          (selectedVerification.identityDocumentUrl
                            ? [selectedVerification.identityDocumentUrl]
                            : [])
                        }
                      />
                    </div>
                  </div>

                  {/* Selfie */}
                  <div className="space-y-2">
                    <Label>Selfie Photo</Label>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      <ExpandableImagePreview
                        url={selectedVerification.selfieUrl ?? undefined}
                        alt="Selfie"
                        title="Selfie"
                      />
                    </div>
                  </div>

                  {/* Vehicle Document */}
                  <div className="space-y-2">
                    <Label>Vehicle Registration</Label>
                    <div className="border rounded-lg p-2 bg-gray-50">
                      {selectedVerification.vehicleDocumentUrl ? (
                        isPdfUrl(selectedVerification.vehicleDocumentUrl) ? (
                          <div className="h-40 flex flex-col items-center justify-center bg-gray-100 rounded gap-2 p-3">
                            <FileText className="h-10 w-10 text-gray-500" />
                            <p className="text-sm font-medium text-gray-700 text-center break-all">
                              {getFilenameFromUrl(selectedVerification.vehicleDocumentUrl) || "Vehicle document.pdf"}
                            </p>
                            <div className="flex gap-2">
                              <a
                                href={selectedVerification.vehicleDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-sm text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Open
                              </a>
                              <a
                                href={selectedVerification.vehicleDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-sm text-primary hover:underline"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </a>
                            </div>
                          </div>
                        ) : (
                          <ExpandableImagePreview
                            url={selectedVerification.vehicleDocumentUrl}
                            alt="Vehicle Document"
                            title="Vehicle Registration"
                          />
                        )
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-gray-100 rounded">
                          <p className="text-sm text-gray-500">Not provided</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedVerification.status === "KYC_STATUS_REJECTED" && (
                <div className="space-y-2">
                  <Label>Rejection Reason</Label>
                  <p className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {selectedVerification.rejectionReason || "No reason provided"}
                  </p>
                </div>
              )}

              {/* Action Buttons (only for pending) */}
              {selectedVerification.status === "KYC_STATUS_PENDING" && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">
                      Rejection Reason (required if rejecting)
                    </Label>
                    <Input
                      id="rejectionReason"
                      placeholder="Enter reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetailModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                    <Button onClick={handleApprove} disabled={actionLoading}>
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expanded image viewer */}
      <Dialog
        open={!!expandedImage}
        onOpenChange={(open) => {
          if (!open) setExpandedImage(null);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{expandedImage?.title ?? "Preview"}</DialogTitle>
          </DialogHeader>
          {expandedImage?.url && (
            <div className="relative w-full h-[70vh] bg-gray-50 rounded">
              <Image
                src={expandedImage.url}
                alt={expandedImage.title ?? "Expanded image"}
                fill
                className="object-contain"
              />
            </div>
          )}
          <DialogFooter>
            {expandedImage?.url && (
              <a
                href={expandedImage.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in new tab
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
