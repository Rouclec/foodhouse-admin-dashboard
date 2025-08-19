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
import { Search, Edit, Trash2, Package } from "lucide-react";
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

export default function ProductsPage() {
  const { user } = useContext(Context) as ContextType;
  const [deletingProduct, setDeletingProduct] = useState<string>();

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
        userId: user?.userId ?? "",
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

  const handleDeleteProduct = async (productId: string): Promise<void> => {
    try {
      setDeletingProduct(productId);
      setLoading(true);

      await deleteProduct({
        path: {
          productId: productId,
          userId: user?.userId ?? "",
        },
      });

      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });

      refetchProducts();
    } catch (error) {
      console.error({ error }, "deleting product");
    } finally {
      setDeletingProduct(undefined);
      setLoading(false);
    }
  };

  const handleEditProduct = (productId: string) => {
    console.log("Edit product:", productId);
  };

  const handleNextPage = () => {
    if (productsData?.nextKey && productsData.nextKey !== "") {
      pagination.goToNextPage(productsData.nextKey.toString());
    }
  };

  const categoryMap = categoriesData?.categories?.reduce(
    (acc: Record<string, string>, category) => {
      if (category.id && category.name) {
        acc[category.id] = category.name;
      }
      return acc;
    },
    {}
  );

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
                  <TableRow key={product?.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product?.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {categoryMap?.[product?.category?.id || ""] || "N/A"}
                    </TableCell>

                    <TableCell>
                      {product?.amount?.value}{" "}
                      {product?.amount?.currencyIsoCode}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {moment(product?.createdAt).format("DD-MM-YYYY")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product?.id ?? "")}
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleDeleteProduct(product?.id ?? "");
                          }}
                          disabled={loading}
                          className={`${loading && "cursor-not-allowed"}`}
                          title="Delete product"
                        >
                          {loading && deletingProduct === product?.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
    </div>
  );
}
