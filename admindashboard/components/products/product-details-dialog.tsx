"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Package,
  User,
  Mail,
  MapPin,
  Phone,
  MessageCircle,
  Calendar,
  Edit,
  Trash2,
  ImageIcon,
  ZoomIn,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useContext, useState } from "react";
import {
  productsgrpcCategory,
  productsgrpcProduct,
} from "@/client/products.swagger";
import { formatCurrency } from "@/utils";
import { usersGetFarmerById } from "@/client/users.swagger";
import { usersGetFarmerByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/contexts/QueryProvider";

interface ProductDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: productsgrpcProduct | undefined;
  category: productsgrpcCategory | undefined;
  onEdit?: (product: productsgrpcProduct) => void;
  onDelete?: (product: productsgrpcProduct) => void;
}

// Single image viewer modal component
interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string;
  productName: string;
}

function ImageViewerModal({
  isOpen,
  onClose,
  image,
  productName,
}: ImageViewerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
            <h3 className="text-white font-medium truncate">{productName}</h3>
          </div>

          {/* Main Image */}
          <div className="relative aspect-square max-h-[80vh] flex items-center justify-center">
            <img
              src={image || "/placeholder.svg"}
              alt={productName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProductDetailsDialog({
  isOpen,
  onClose,
  product,
  category,
  onEdit,
  onDelete,
}: ProductDetailsDialogProps) {
  const [showImageViewer, setShowImageViewer] = useState(false);

  const { user: adminUser } = useContext(Context) as ContextType;

  const { data: farmerData, isLoading: isFarmerLoading } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        farmerId: product?.createdBy ?? "",
        userId: adminUser?.userId ?? "",
      },
    }),
    enabled: !!adminUser?.userId && !!product?.createdBy && isOpen,
  });

  if (!product) return null;

  const handleWhatsAppContact = () => {
    if (!farmerData?.user?.phoneNumber) return;
    const message = encodeURIComponent(
      `Hello ${farmerData?.user?.firstName}! I'm contacting you regarding your product "${product.name}".`
    );
    const whatsappUrl = `https://wa.me/${farmerData?.user?.phoneNumber?.replace(
      /[^0-9]/g,
      ""
    )}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handlePhoneCall = () => {
    if (!farmerData?.user?.phoneNumber) return;
    window.open(`tel:${farmerData?.user?.phoneNumber}`, "_self");
  };

  const handleEdit = () => {
    onEdit?.(product);
  };

  const handleDelete = () => {
    onDelete?.(product);
  };

  const handleImageClick = () => {
    setShowImageViewer(true);
  };

  // Show loading state for the entire modal content
  if (isFarmerLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span className="truncate">{product?.name}</span>
            </DialogTitle>
            <DialogDescription>
              <span>Category: {category?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground">
                Loading product details...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[900px] max-w-[95vw] max-h-[95vh] mx-auto overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 mt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Package className="h-5 w-5" />
                  <span className="truncate">{product?.name}</span>
                </DialogTitle>
                <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                  <span>Category: {category?.name}</span>
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  title="Edit Product"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  title="Delete Product"
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Product Image */}
            {product.image && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Product Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className="relative group cursor-pointer"
                    onClick={handleImageClick}
                  >
                    <div className="aspect-square sm:aspect-video max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Image Placeholder */}
            {!product.image && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No image available for this product
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Product Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Price
                    </p>
                    <span className="text-xl font-bold text-green-600">
                      {product?.amount?.value &&
                      product?.amount?.currencyIsoCode
                        ? formatCurrency(
                            product.amount.value,
                            product.amount.currencyIsoCode
                          )
                        : "N/A"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Created
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {product?.createdAt
                          ? new Date(product.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {product.updatedAt && (
                    <div className="sm:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Last Updated
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {product.description && (
                  <>
                    <Separator className="my-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Description
                      </p>
                      <p className="text-sm leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Farmer Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Farmer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Mobile: Stacked layout */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Farmer
                      </p>
                      <p className="text-sm font-medium">
                        {farmerData?.user?.firstName}{" "}
                        {farmerData?.user?.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Email
                      </p>
                      <p className="text-sm truncate">
                        {farmerData?.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Phone
                      </p>
                      <p className="text-sm">{farmerData?.user?.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Address
                      </p>
                      <p className="text-sm">
                        {farmerData?.user?.locationCoordinates?.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Desktop: Grid layout */}
                <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Farmer Name
                    </p>
                    <p className="font-medium">
                      {farmerData?.user?.firstName} {farmerData?.user?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </p>
                    <p className="truncate">{farmerData?.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Phone
                    </p>
                    <p>{farmerData?.user?.phoneNumber}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Address
                    </p>
                    <p>{farmerData?.user?.locationCoordinates?.address}</p>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Contact Actions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Contact Farmer
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleWhatsAppContact}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      disabled={!farmerData?.user?.phoneNumber}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      onClick={handlePhoneCall}
                      variant="outline"
                      className="flex-1 bg-transparent"
                      size="sm"
                      disabled={!farmerData?.user?.phoneNumber}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Modal */}
      {product.image && (
        <ImageViewerModal
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          image={product.image}
          productName={product.name || "Product"}
        />
      )}
    </>
  );
}
