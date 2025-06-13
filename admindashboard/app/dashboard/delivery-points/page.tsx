"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
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
import { Plus, Edit, Trash2, MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Autocomplete } from "@react-google-maps/api";
import { AddressAutocompleteInput } from "@/components/address-auto-complete";
// import type { google } from "googlemaps"

interface DeliveryPoint {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  address: string;
  createdBy: string;
  createdAt: string;
}

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
  const [deliveryPoints, setDeliveryPoints] = useState<DeliveryPoint[]>([
    {
      id: "1",
      name: "Lagos Island Hub",
      city: "Lagos",
      latitude: 6.4541,
      longitude: 3.3947,
      address: "Victoria Island, Lagos, Nigeria",
      createdBy: "Admin",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Ikeja Distribution Center",
      city: "Lagos",
      latitude: 6.6018,
      longitude: 3.3515,
      address: "Ikeja, Lagos, Nigeria",
      createdBy: "Admin",
      createdAt: "2024-01-16",
    },
    {
      id: "3",
      name: "Abuja Central Point",
      city: "Abuja",
      latitude: 9.0579,
      longitude: 7.4951,
      address: "Central Business District, Abuja, Nigeria",
      createdBy: "Admin",
      createdAt: "2024-01-17",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<DeliveryPoint | null>(null);
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

  const { toast } = useToast();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAP_API_KEY || "",
    libraries,
  });

  const filteredPoints = deliveryPoints.filter(
    (point) =>
      point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      // Update existing delivery point
      setDeliveryPoints(
        deliveryPoints.map((point) =>
          point.id === editingPoint.id
            ? {
                ...point,
                name: formData.name,
                city: formData.city,
                latitude: formData.latitude,
                longitude: formData.longitude,
                address: formData.address,
              }
            : point
        )
      );
      toast({
        title: "Delivery point updated",
        description: "The delivery point has been successfully updated.",
      });
    } else {
      // Create new delivery point
      const newPoint: DeliveryPoint = {
        id: Date.now().toString(),
        name: formData.name,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        createdBy: "Admin",
        createdAt: new Date().toISOString().split("T")[0],
      };
      setDeliveryPoints([...deliveryPoints, newPoint]);
      toast({
        title: "Delivery point created",
        description: "The new delivery point has been successfully created.",
      });
    }

    resetForm();
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
    setEditingPoint(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (point: DeliveryPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      city: point.city,
      latitude: point.latitude,
      longitude: point.longitude,
      address: point.address,
    });
    const position = { lat: point.latitude, lng: point.longitude };
    setMapCenter(position);
    setMarkerPosition(position);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeliveryPoints(deliveryPoints.filter((point) => point.id !== id));
    toast({
      title: "Delivery point deleted",
      description: "The delivery point has been successfully deleted.",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  useEffect(() => {
    setTimeout(() => (document.body.style.pointerEvents = ""), 0);
  }, []);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Points</h1>
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
                  {/* <Autocomplete
                    onLoad={(autocomplete) => {
                      autocompleteRef.current = autocomplete;
                    }}
                    onPlaceChanged={onPlaceChanged}
                    className="pac-container"
                  >
                    <Input
                      id="address"
                      placeholder="Search for a location..."
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </Autocomplete> */}
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
                      readOnly
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
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPoint
                    ? "Update Delivery Point"
                    : "Create Delivery Point"}
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
              placeholder="Search by name, city, or address..."
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
            Showing {filteredPoints.length} of {deliveryPoints.length} delivery
            points
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">City</TableHead>
                <TableHead className="hidden md:table-cell">Address</TableHead>
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
              {filteredPoints.map((point) => (
                <TableRow key={point.id}>
                  <TableCell className="font-medium">
                    {point.name}
                    <div className="sm:hidden mt-1">
                      <Badge variant="secondary">{point.city}</Badge>
                    </div>
                    <div className="md:hidden mt-1 text-xs text-gray-500">
                      {point.address}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary">{point.city}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="max-w-48 truncate" title={point.address}>
                      {point.address}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="text-xs text-gray-600">
                      {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {point.createdBy}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {point.createdAt}
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
                        onClick={() => handleDelete(point.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
