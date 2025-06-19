"use client";

import type React from "react";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Context, ContextType } from "@/app/contexts/QueryProvider";
import { productsgrpcPriceType } from "@/client/products.swagger";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import {
  productsCreatePriceTypeMutation,
  productsDeletePriceTypeMutation,
  productsListCategoriesOptions,
  productsListPriceTypesOptions,
} from "@/client/products.swagger/@tanstack/react-query.gen";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryLoading } from "@/hooks/use-query-loading";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

const quantityUnits = [
  "kg",
  "gram",
  "pound",
  "ounce",
  "bag",
  "sack",
  "box",
  "crate",
  "bunch",
  "piece",
  "dozen",
  "liter",
  "gallon",
  "bottle",
];

export default function PriceTypesPage() {
  const { user } = useContext(Context) as ContextType;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [deletingPriceType, setDeletingPriceType] =
    useState<productsgrpcPriceType>();

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const selectedCategory = categoriesData?.categories?.find(
        (cat) => cat.id === selectedCategoryId
      );
      if (!selectedCategory) return;

      await createPriceType({
        body: {
          name: `per_${selectedUnit}`,
          categoryId: selectedCategoryId,
        },
        path: {
          userId: user?.userId ?? "",
        },
      });
    } catch (error) {
      console.error({ error }, "creating product name");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (priceType: productsgrpcPriceType | undefined) => {
    setDeletingPriceType(priceType);
    confirmDelete.openDialog();
  };

  // Confirm delete hook
  const confirmDelete = useConfirmDelete({
    onDelete: async () => {
      setLoading(true);
      if (deletingPriceType) {
        await deletePriceType({
          path: {
            userId: user?.userId ?? "",
            priceTypeId: deletingPriceType?.id ?? "",
          },
        });
      }
      setLoading(false);
    },
    itemType: deletingPriceType?.name,
    description:
      "Deleting this price will delete all the products associated with it",
  });

  const openCreateDialog = () => {
    setSelectedUnit(undefined);
    setSelectedCategoryId("");
    setIsDialogOpen(true);
  };

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    ...productsListCategoriesOptions({}),
  });

  const {
    data: priceTypesData,
    isLoading: isPriceTypesLoading,
    refetch,
  } = useQuery({
    ...productsListPriceTypesOptions({}),
  });

  useQueryLoading(isCategoriesLoading || isPriceTypesLoading);

  const { mutateAsync: createPriceType } = useMutation({
    ...productsCreatePriceTypeMutation(),
    onSuccess: () => {
      setSelectedUnit(undefined);
      setSelectedCategoryId("");
      setIsDialogOpen(false);
      toast({
        title: "Price type created",
        description: "The price type has been successfully created.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error creating price type",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

  const { mutateAsync: deletePriceType } = useMutation({
    ...productsDeletePriceTypeMutation(),
    onSuccess: () => {
      setDeletingPriceType(undefined);
      toast({
        title: "Price type deleted",
        description: "The price type has been successfully deleted.",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error deleting product name",
        description:
          error?.response?.data?.message ?? "An unkonwn error occured",
      });
    },
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Price Types</h1>
            <p className="text-gray-600">
              Manage pricing units for different product categories
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Price Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{"Create New Price Type"}</DialogTitle>
                <DialogDescription>
                  {"Add a new pricing unit for a product category."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesData?.categories?.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id ?? ""}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Quantity Unit</Label>
                    <Select
                      value={selectedUnit}
                      onValueChange={setSelectedUnit}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {quantityUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            per {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedUnit && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">
                        <strong>Preview:</strong> Price will be displayed as
                        "per {selectedUnit}"
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">{"Create Price Type"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Price Types Overview
            </CardTitle>
            <CardDescription>
              Total price types: {priceTypesData?.priceTypes?.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Display Format
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Created By
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priceTypesData?.priceTypes?.map((priceType) => (
                  <TableRow key={priceType.id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {
                          categoriesData?.categories?.find(
                            (category) => category?.id === priceType?.categoryId
                          )?.name
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {priceType?.slug?.replace("per_", "")}
                      <div className="md:hidden mt-1 text-xs text-green-600">
                        per {priceType?.slug?.replace("per_", "")}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-green-600 font-medium">
                        per {priceType?.slug?.replace("per_", "")}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      Admin
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(priceType)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {(priceTypesData?.priceTypes ?? []).length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No price types found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDeleteDialog
        {...confirmDelete.dialogProps}
        itemName={deletePriceType?.name}
        isLoading={loading}
      />
    </>
  );
}
