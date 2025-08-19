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
import { Search, Package, Trash2 } from "lucide-react";
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
import ProductDetailsModal from "@/components/productsDetailsModal";
import moment from "moment";

export default function ProductsPage() {
  const { user: adminUser } = useContext(Context) as ContextType;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{
    id: string;
    name: string;
    createdBy: string;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const pagination = useCursorPagination({
    initialStartKey: "",
    pageSize: 10,
  });

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
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

  const handleOpenDetailsDialog = (product: any) => {
    setSelectedProduct(product);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedProduct(null);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-600">Manage products in the marketplace</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2 text-gray-500" />
            Product Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by product name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value)}
            >
              <SelectTrigger className="w-48">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Showing {productsData?.products?.length ?? 0} products
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Created Date
                  </TableHead>
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
                      <div>
                        <p className="font-medium">{product?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {categoryMap[product?.category?.id || ""] || "N/A"}
                    </TableCell>
                    <TableCell>
                      {product?.amount?.value}{" "}
                      {product?.amount?.currencyIsoCode}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {moment(product?.createdAt).format("DD-MM-YYYY")}
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
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleOpenDeleteDialog(
                              product?.id ?? "",
                              product?.name ?? "this product",
                              product?.createdBy ?? ""
                            )
                          }
                          title="Delete product"
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
        </CardContent>
      </Card>

      {/* Product Details Modal */}
      <ProductDetailsModal
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        product={selectedProduct}
        onDelete={handleOpenDeleteDialog}
        onRefetch={refetchProducts}
        adminUserId={adminUser?.userId ?? ""}
        categoriesData={categoriesData}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
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
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={loading}
              className={loading ? "cursor-not-allowed opacity-80" : ""}
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