"use client";

import { useContext, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Package,
  Trash2,
  Image as ImageIcon,
  Globe,
  EyeClosed,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { CursorPagination } from "@/components/ui/cursor-pagination";
import {
  productsListProductsOptions,
  productsDeleteProductMutation,
  productsListCategoriesOptions,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import moment from "moment";
import { usersGetFarmerByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import Image from "next/image";
import { ProductDetailsDialog } from "@/components/products/product-details-dialog";
import { productsgrpcProduct } from "@/client/products.swagger";
import { EditProductDialog } from "@/components/products/edit-product-dialog";

const STATUS_FILTERS: Array<{
  label: string;
  value: string;
}> = [
  {
    label: "All Products",
    value: "null",
  },
  {
    label: "Published",
    value: "true",
  },
  {
    label: "Unpublished",
    value: "false",
  },
];
export default function ProductsPage() {
  const { user: adminUser } = useContext(Context) as ContextType;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
    createdBy: string;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<productsgrpcProduct>();

  const pagination = useCursorPagination({
    initialStartKey: "",
    pageSize: 10,
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    | {
        label: string;
        value: string;
      }
    | undefined
  >(STATUS_FILTERS[0]);
  const { toast } = useToast();

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions({}),
  });

  const {
    data: productsData,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useQuery({
    ...productsListProductsOptions({
      path: {
        userId: adminUser?.userId ?? "",
      },
      query: {
        search: searchTerm,
        startKey: pagination.startKey,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
        count: pagination.pageSize,
        isApproved:
          statusFilter?.value === "true"
            ? true
            : statusFilter?.value === "false"
            ? false
            : undefined,
      },
    }),
    placeholderData: keepPreviousData,
  });

  const { mutateAsync: deleteProduct } = useMutation({
    ...productsDeleteProductMutation(),
    onError: (error) => {
      toast({
        title: "Error deleting product",
        description:
          error?.response?.data?.message ?? "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  useQueryLoading(isProductsLoading || isCategoriesLoading);

  // Move the farmer query inside the component and use it per product
  const FarmerCell = ({ farmerId }: { farmerId: string }) => {
    const { data: farmerData, isLoading: isFarmerLoading } = useQuery({
      ...usersGetFarmerByIdOptions({
        path: {
          farmerId: farmerId,
          userId: adminUser?.userId ?? "",
        },
      }),
      enabled: !!farmerId,
    });

    if (isFarmerLoading) return <span className="text-sm">Loading...</span>;
    if (!farmerData) return <span className="text-sm">N/A</span>;

    return (
      <span className="text-sm">
        {farmerData.user
          ? `${farmerData.user.firstName} ${farmerData.user.lastName}`
          : "N/A"}
      </span>
    );
  };

  const handleOpenDetailsDialog = (
    product: productsgrpcProduct | undefined
  ) => {
    setSelectedProduct(product);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedProduct(undefined);
  };

  const handleEditProduct = (product: productsgrpcProduct) => {
    setSelectedProduct(product);
    setShowEditDialog(true);
  };

  const handleOpenDeleteDialog = (
    productId: string,
    productName: string,
    createdBy: string
  ) => {
    setProductToDelete({ id: productId, name: productName, createdBy });
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!productToDelete) return;

    try {
      setLoading(true);

      await deleteProduct({
        path: {
          productId: productToDelete.id,
          userId: productToDelete.createdBy,
        },
      });

      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });

      refetchProducts();
      handleCloseDeleteDialog();
      handleCloseDetailsDialog();
    } catch (error) {
      console.error({ error }, "deleting product");
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (productsData?.nextKey && productsData.nextKey !== "") {
      pagination.goToNextPage(productsData.nextKey.toString());
    }
  };

  const handleToogleStatus = async (product: productsgrpcProduct) => {
    try {
      setLoading(true);
      if (product?.isApproved) {
        // unpublish
        console.log("unpublishing");
      } else {
        // publish
        console.log("publishing");
      }
    } catch (error) {
      console.error({ error }, "toogling product");
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesData?.categories?.forEach((category) => {
      if (category.id && category.name) {
        map[category.id] = category.name;
      }
    });
    return map;
  }, [categoriesData]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage products in the marketplace
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="px-4 py-4 md:px-6 md:py-6">
          <CardTitle className="flex items-center text-lg md:text-xl">
            <Package className="h-4 w-4 md:h-5 md:w-5 mr-2 text-gray-500" />
            Product Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 md:px-6 md:pb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoriesData?.categories?.map((category) => (
                  <SelectItem value={category.id || ""} key={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter?.value}
              onValueChange={(value) =>
                setStatusFilter(
                  STATUS_FILTERS.find((item) => item?.value === value)
                )
              }
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS?.map((status) => (
                  <SelectItem value={status.value} key={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full overflow-hidden">
        <CardHeader className="px-4 py-4 md:px-6 md:py-6">
          <CardTitle className="text-lg md:text-xl">Products</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Showing {productsData?.products?.length ?? 0} products
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 md:p-6">
          <div className="space-y-4">
            {/* Mobile View */}
            <div className="md:hidden space-y-4 px-4 pb-4">
              {productsData?.products?.map((product) => (
                <Card
                  key={product?.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleOpenDetailsDialog(product)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {product.image ? (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden border">
                            <Image
                              src={product.image}
                              alt={product?.name || "Product"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-row items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {product?.name}
                          </h3>
                          <div
                            className={`flex flex-row w-fit items-center gap-x-1 px-2 py-1 rounded-full ${
                              product?.isApproved
                                ? "bg-green-100"
                                : "bg-yellow-100"
                            }`}
                          >
                            {product?.isApproved ? (
                              <Globe className="w-4 h-4 text-green-700" />
                            ) : (
                              <EyeClosed className="w-4 h-4 text-yellow-700" />
                            )}
                            <p
                              className={`text-xs font-medium ${
                                product?.isApproved
                                  ? "text-green-700"
                                  : "text-yellow-700"
                              }`}
                            >
                              {product?.isApproved
                                ? "Published"
                                : "UnPublished"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Category:{" "}
                          {categoryMap[product?.category?.id || ""] || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Farmer:{" "}
                          {product?.createdBy ? (
                            <FarmerCell farmerId={product.createdBy} />
                          ) : (
                            "N/A"
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created:{" "}
                          {moment(product?.createdAt).format("DD-MM-YYYY")}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetailsDialog(product);
                        }}
                        title="View details"
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToogleStatus(product);
                        }}
                        disabled={loading}
                        title={product?.isApproved ? "Unpublish" : "Publish"}
                        className="h-8 w-8 p-0"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" />
                        ) : product?.isApproved ? (
                          <EyeClosed className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDeleteDialog(
                            product?.id ?? "",
                            product?.name ?? "this product",
                            product?.createdBy ?? ""
                          );
                        }}
                        title="Delete product"
                        className="h-8 w-8 p-0 text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {productsData?.products?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </div>

            {/* Desktop/Tablet View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Farmers</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData?.products?.map((product) => (
                    <TableRow
                      key={product?.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleOpenDetailsDialog(product)}
                    >
                      <TableCell>
                        {product?.image ? (
                          <div className="relative h-10 w-10 rounded-full overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product?.name || "Product"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product?.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {categoryMap[product?.category?.id || ""] || "N/A"}
                      </TableCell>
                      <TableCell>
                        {product?.createdBy ? (
                          <FarmerCell farmerId={product.createdBy} />
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {moment(product?.createdAt).format("DD-MM-YYYY")}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`flex flex-row items-center w-fit gap-x-1 px-2 py-1 rounded-full ${
                            product?.isApproved
                              ? "bg-green-100"
                              : "bg-yellow-100"
                          }`}
                        >
                          {product?.isApproved ? (
                            <Globe className="w-4 h-4 text-green-700" />
                          ) : (
                            <EyeClosed className="w-4 h-4 text-yellow-700" />
                          )}
                          <p
                            className={`text-xs font-medium ${
                              product?.isApproved
                                ? "text-green-700"
                                : "text-yellow-700"
                            }`}
                          >
                            {product?.isApproved ? "Published" : "UnPublished"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetailsDialog(product)}
                            title="View details"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToogleStatus(product);
                            }}
                            title={
                              product?.isApproved ? "Unpublish" : "Publish"
                            }
                            className="h-8 w-8 p-0"
                          >
                            {loading ? (
                              <LoadingSpinner size="sm" />
                            ) : product?.isApproved ? (
                              <EyeClosed className="w-4 h-4" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            title="Delete Product"
                            className="text-red-600"
                            onClick={() =>
                              handleOpenDeleteDialog(
                                product?.id ?? "",
                                product?.name ?? "this product",
                                product?.createdBy ?? ""
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {productsData?.products?.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </div>

            <div className="px-4 md:px-0">
              <CursorPagination
                currentPage={pagination.currentPage}
                nextKey={productsData?.nextKey?.toString()}
                canGoToPrevious={pagination.canGoToPrevious}
                onPreviousPage={pagination.goToPreviousPage}
                onNextPage={handleNextPage}
                onFirstPage={pagination.goToFirstPage}
                isLoading={isProductsLoading}
                itemsPerPage={pagination.pageSize}
                totalItemsOnPage={productsData?.products?.length ?? 0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsDialog
        isOpen={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
        }}
        onEdit={(product) => handleEditProduct(product)}
        product={selectedProduct}
        category={categoriesData?.categories?.find(
          (cat) => cat.id === selectedProduct?.category?.id
        )}
        onDelete={() =>
          handleOpenDeleteDialog(
            selectedProduct?.id ?? "",
            selectedProduct?.name ?? "this product",
            selectedProduct?.createdBy ?? ""
          )
        }
      />

      {/* Edit Product Dialog */}
      <EditProductDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        product={selectedProduct}
        onSave={() => refetchProducts()}
        category={categoriesData?.categories?.find(
          (cat) => cat.id === selectedProduct?.category?.id
        )}
      />

      {/* confirm delete dialog  */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Product Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDeleteDialog}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
              className={`w-full sm:w-auto ${
                loading ? "cursor-not-allowed opacity-80" : ""
              }`}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Anyway"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
