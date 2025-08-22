"use client";

import { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Package, DollarSign, Calendar, ImageIcon } from "lucide-react";
import {
  productsgrpcCategory,
  productsgrpcProduct,
  productsgrpcUpdateProductResponse,
  ProductsUpdateProductBody,
} from "@/client/products.swagger";
import { formatCurrency } from "@/utils";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usersGetFarmerByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { productsUpdateProductMutation } from "@/client/products.swagger/@tanstack/react-query.gen";

const editProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface EditProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: productsgrpcProduct | undefined;
  category: productsgrpcCategory | undefined;
  onSave?: (updatedProduct: productsgrpcProduct) => void;
}

export function EditProductDialog({
  isOpen,
  onClose,
  product,
  onSave,
  category,
}: EditProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
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

  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Reset form when product changes
  useEffect(() => {
    if (product && isOpen) {
      form.reset({
        name: product.name,
        description: product.description || "",
      });
    }
  }, [product, isOpen, form]);

  const { mutateAsync: updateProduct } = useMutation({
    ...productsUpdateProductMutation(),
    onError: (error) => {
      toast({
        title: "Error updating product",
        description:
          error?.response?.data?.message ?? "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: EditProductFormData) => {
    if (!product) return;

    setIsSubmitting(true);
    try {
      const updatedProduct: ProductsUpdateProductBody = {
        ...product,
        ...data,
        categoryId: product.category?.id ?? "",
      };

      await updateProduct({
        path: {
          productId: product.id ?? "",
          userId: product.createdBy ?? "",
        },
        body: updatedProduct,
      });

      onSave?.(updatedProduct);
      onClose();
      toast({
        title: "Success",
        description: "Product updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
      console.error("Update product error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[700px] max-w-[95vw] max-h-[95vh] mx-auto overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-5 w-5" />
            Edit Product
          </DialogTitle>
          <DialogDescription>
            Update the product name and description. Other information is
            managed by the farmer.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Product Image (Read-only) */}
          {product.image && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Product Image
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="aspect-square sm:aspect-video max-w-sm mx-auto rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Editable Fields */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Editable Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter product description..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="w-full sm:w-auto bg-transparent"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? "Updating..." : "Update Product"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Read-only Product Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Product Information (Read-only)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Mobile: Stacked layout */}
              <div className="block sm:hidden space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Category
                    </p>
                    <p className="text-sm font-medium">{category?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Price
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(
                        product?.amount?.value ?? "",
                        product?.amount?.currencyIsoCode ?? ""
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Category
                  </p>
                  <p className="font-medium">{category?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Price
                  </p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(
                      product?.amount?.value ?? "",
                      product?.amount?.currencyIsoCode ?? ""
                    )}
                  </p>
                </div>
                <Separator className="my-4" />

                {/* Farmer Information */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3">
                    Farmer Information
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Farmer Name
                      </p>
                      <p className="text-sm">
                        {farmerData?.user?.firstName}{" "}
                        {farmerData?.user?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Timestamps */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Created
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">
                      {new Date(product?.createdAt ?? "").toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {product.updatedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Last Updated
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">
                        {new Date(
                          product?.updatedAt ?? ""
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
