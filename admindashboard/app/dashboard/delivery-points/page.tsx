"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MapPin, Search, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { AddressAutocompleteInput } from "@/components/address-auto-complete";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  ordersCreateDeliveryPointMutation,
  ordersDeleteDeliveryPointMutation,
  ordersListDeliveryPointsOptions,
  ordersUpdateDeliveryPointMutation,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { ordersgrpcDeliveryPoint } from "@/client/orders.swagger";
import { useQueryLoading } from "@/hooks/use-query-loading";
import moment from "moment";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { CursorPagination } from "@/components/ui/cursor-pagination";

const libraries: "places"[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 4.1594, // Buea, Cameroon
  lng: 9.2435,
};

export default function DeliveryPointsPage() {
  const { user } = useContext(Context) as ContextType;
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<ordersgrpcDeliveryPoint>();
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    latitude: 0,
    longitude: 0,
    address: "",
  });
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingPointId, setDeletingPointId] = useState<string>();
  const [deletingPointName, setDeletingPointName] = useState<string>();

  const { toast } = useToast();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAP_API_KEY || "",
    libraries,
  });

  const pagination = useCursorPagination({
    pageSize: 10,
  });

  const {
    data: deliveryPointsData,
    isLoading: isDeliveryPointsLoading,
    refetch,
  } = useQuery({
    ...ordersListDeliveryPointsOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        startKey: pagination.startKey,
        count: pagination.pageSize,
        city: searchTerm,
      },
    }),
    placeholderData: keepPreviousData,
  });

  const [selectedAddress, setSelectedAddress] = useState("");

  const onPlaceChanged = useCallback(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      setSelectedAddress(place?.name ?? place?.formatted_address ?? "");

      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Extract city from address components
        let city = "";
        if (place.address_components) {
          for (const component of place.address_components) {
            if (
              component.types.includes("locality") ||
              component.types.includes("administrative_area_level_1")
            ) {
              city = component.long_name;
              break;
            }
          }
        }

        let country = "";
        if (place.address_components) {
          for (const component of place.address_components) {
            if (component.types.includes("country")) {
              country = component.long_name;
              break;
            }
          }
        }

        setFormData({
          ...formData,
          address: place.formatted_address || "",
          city: !!country ? `${city}, ${country}` : city,
          latitude: lat,
          longitude: lng,
        });

        const newPosition = { lat, lng };
        setMapCenter(newPosition);
        setMarkerPosition(newPosition);
      }
    }
  }, [formData]);

  useQueryLoading(isDeliveryPointsLoading);

  const onMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();

        setMarkerPosition({ lat, lng });
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
        });

        // Reverse geocoding to get address and city
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              const result = results[0];
              let city = "";

              for (const component of result.address_components) {
                if (
                  component.types.includes("locality") ||
                  component.types.includes("administrative_area_level_1")
                ) {
                  city = component.long_name;
                  break;
                }
              }

              setFormData((prev) => ({
                ...prev,
                address: result.formatted_address,
                city: city,
              }));
            }
          });
        }
      }
    },
    [formData]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (
        !formData.name ||
        !formData.address ||
        !formData.latitude ||
        !formData.longitude
      ) {
        toast({
          title: "Error",
          description:
            "Please fill in all required fields and select a location.",
          variant: "destructive",
        });
        return;
      }

      if (editingPoint) {
        await updateDeliveryPoint({
          body: {
            address: {
              address: formData?.address,
              lat: formData?.latitude,
              lon: formData?.longitude,
            },
            city: formData?.city,
            deliveryPointName: formData?.name,
          },
          path: {
            userId: user?.userId ?? "",
            id: editingPoint?.id ?? "",
          },
        });
        toast({
          title: "Delivery point updated",
          description: "The delivery point has been successfully updated.",
        });
      } else {
        // Create new delivery point
        await createDeliveryPoint({
          body: {
            address: {
              address: formData?.address,
              lat: formData?.latitude,
              lon: formData?.longitude,
            },
            city: formData?.city,
            deliveryPointName: formData?.name,
          },
          path: {
            userId: user?.userId ?? "",
          },
        });
        toast({
          title: "Delivery point created",
          description: "The new delivery point has been successfully created.",
        });
      }

      resetForm();
      refetch();
    } catch (error) {
      console.error({ error }, "creating or updating delivery point");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      city: "",
      latitude: 0,
      longitude: 0,
      address: "",
    });
    setMapCenter(defaultCenter);
    setMarkerPosition(defaultCenter);
    setEditingPoint(undefined);
    setIsDialogOpen(false);
  };

  const handleEdit = (point: ordersgrpcDeliveryPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.deliveryPointName ?? "",
      city: point.city ?? "",
      latitude: point.address?.lat ?? 0.0,
      longitude: point.address?.lon ?? 0.0,
      address: point.address?.address ?? "",
    });
    const position = {
      lat: point.address?.lat ?? 0.0,
      lng: point.address?.lon ?? 0.0,
    };
    setMapCenter(position);
    setMarkerPosition(position);
    setIsDialogOpen(true);
  };

  const handleDelete = (point: ordersgrpcDeliveryPoint) => {
    setDeletingPointId(point?.id);
    setDeletingPointName(point?.deliveryPointName);
    confirmDelete.openDialog();
  };

  // Confirm delete hook
  const confirmDelete = useConfirmDelete({
    onDelete: async () => {
      setLoading(true);
      if (deletingPointId) {
        await deleteDeliveryPoint({
          path: { userId: user?.userId ?? "", id: deletingPointId },
        });
      }
      setLoading(false);
    },
    itemType: deletingPointName,
    description: "Are you sure you want to delete this delivery point?",
  });

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    setTimeout(() => (document.body.style.pointerEvents = ""), 0);
  }, []);

  const { mutateAsync: createDeliveryPoint } = useMutation({
    ...ordersCreateDeliveryPointMutation(),
    onError: (error) => {
      toast({
        title: "Error creating delivery point",
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: updateDeliveryPoint } = useMutation({
    ...ordersUpdateDeliveryPointMutation(),
    onError: (error) => {
      toast({
        title: "Error updating delivery point",
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const { mutateAsync: deleteDeliveryPoint } = useMutation({
    ...ordersDeleteDeliveryPointMutation(),
    onSuccess: () => {
      toast({
        title: "Delivery point deleted",
        description: "The delivery point has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting delivery point",
        description:
          error?.response?.data?.message ?? "An unknown error occured",
        variant: "destructive",
      });
    },
  });

  const handleNextPage = () => {
    // Only proceed if nextKey exists and is not empty
    if (deliveryPointsData?.nextKey && deliveryPointsData?.nextKey !== "") {
      pagination.goToNextPage(deliveryPointsData.nextKey);
    }
  };

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Delivery Points
            </h1>
            <p className="text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">
                Loading Google Maps API...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Delivery Points
            </h1>
            <p className="text-gray-600">
              Manage delivery locations for your marketplace
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Delivery Point
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPoint
                    ? "Edit Delivery Point"
                    : "Create New Delivery Point"}
                </DialogTitle>
                <DialogDescription>
                  {editingPoint
                    ? "Update the delivery point information below."
                    : "Add a new delivery point by searching for a location or clicking on the map."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Delivery Point Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Mile 17 Motor park Buea, Cameroon"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Search Location</Label>
                    <AddressAutocompleteInput
                      placeholder="Start typing an address..."
                      value={selectedAddress}
                      onChange={setSelectedAddress}
                      onPlaceChanged={onPlaceChanged}
                      onLoad={(autocomplete) => {
                        autocompleteRef.current = autocomplete;
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        placeholder="Auto-detected"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        // readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="0.000000"
                        value={formData.latitude || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            latitude: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="0.000000"
                        value={formData.longitude || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            longitude: Number.parseFloat(e.target.value) || 0,
                          })
                        }
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location on Map</Label>
                    <p className="text-sm text-gray-600">
                      Click on the map to adjust the exact location
                    </p>
                    <div className="border rounded-lg overflow-hidden">
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={13}
                        onClick={onMapClick}
                      >
                        <Marker position={markerPosition} />
                      </GoogleMap>
                    </div>
                  </div>

                  {formData.address && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>Selected Location:</strong> {formData.address}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        City: {formData.city} | Coordinates:{" "}
                        {formData.latitude.toFixed(6)},{" "}
                        {formData.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className={`${
                      loading &&
                      "bg-gray-500 hover:bg-grey-500 hover:cursor-not-allowed bg-opacity-80"
                    }`}
                  >
                    {editingPoint
                      ? "Update Delivery Point"
                      : "Create Delivery Point"}
                    {loading && (
                      <Loader2 className={"animate-spin text-white"} />
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Delivery Point Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by city"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Points Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Points</CardTitle>
            <CardDescription>
              Showing {deliveryPointsData?.deliveryPoints?.length ?? 0} of{" "}
              {deliveryPointsData?.deliveryPoints?.length ?? 0} delivery points
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">City</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Address
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Coordinates
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Created By
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Created Date
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryPointsData?.deliveryPoints?.map((point) => (
                    <TableRow key={point.id}>
                      <TableCell className="font-medium">
                        {point?.deliveryPointName}
                        <div className="sm:hidden mt-1">
                          <Badge variant="secondary">{point?.city}</Badge>
                        </div>
                        <div className="md:hidden mt-1 text-xs text-gray-500">
                          {point?.address?.address}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="secondary">{point?.city}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div
                          className="max-w-48 truncate"
                          title={point?.address?.address}
                        >
                          {point?.address?.address}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-xs text-gray-600">
                          {(point?.address?.lat ?? 0)?.toFixed(4)},{" "}
                          {(point?.address?.lon ?? 0).toFixed(4)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        Admin
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {moment(point?.createdAt ?? "").format("DD-MM-YYYY")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(point)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(point)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(deliveryPointsData?.deliveryPoints ?? []).length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No delivery points found
                  </p>
                </div>
              )}
              <CursorPagination
                currentPage={pagination.currentPage}
                nextKey={deliveryPointsData?.nextKey?.toString()} // Pass the nextKey directly
                canGoToPrevious={pagination.canGoToPrevious}
                onPreviousPage={pagination.goToPreviousPage}
                onNextPage={handleNextPage}
                onFirstPage={pagination.goToFirstPage}
                isLoading={isDeliveryPointsLoading}
                itemsPerPage={pagination.pageSize}
                totalItemsOnPage={
                  deliveryPointsData?.deliveryPoints?.length ?? 0
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        itemName={deletingPointName}
        isLoading={loading}
      />
    </>
  );
}
