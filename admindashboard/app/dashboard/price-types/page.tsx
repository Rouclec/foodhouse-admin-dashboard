"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PriceType {
  id: string
  categoryId: string
  categoryName: string
  unit: string
  createdBy: string
  createdAt: string
}

interface Category {
  id: string
  name: string
}

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
]

export default function PriceTypesPage() {
  const [categories] = useState<Category[]>([
    { id: "1", name: "Vegetables" },
    { id: "2", name: "Fruits" },
    { id: "3", name: "Grains" },
    { id: "4", name: "Dairy" },
  ])

  const [priceTypes, setPriceTypes] = useState<PriceType[]>([
    { id: "1", categoryId: "1", categoryName: "Vegetables", unit: "kg", createdBy: "Admin", createdAt: "2024-01-15" },
    { id: "2", categoryId: "2", categoryName: "Fruits", unit: "kg", createdBy: "Admin", createdAt: "2024-01-16" },
    { id: "3", categoryId: "3", categoryName: "Grains", unit: "bag", createdBy: "Admin", createdAt: "2024-01-17" },
    { id: "4", categoryId: "4", categoryName: "Dairy", unit: "liter", createdBy: "Admin", createdAt: "2024-01-18" },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPriceType, setEditingPriceType] = useState<PriceType | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedUnit, setSelectedUnit] = useState("")
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId)
    if (!selectedCategory) return

    if (editingPriceType) {
      // Update existing price type
      setPriceTypes(
        priceTypes.map((pt) =>
          pt.id === editingPriceType.id
            ? { ...pt, categoryId: selectedCategoryId, categoryName: selectedCategory.name, unit: selectedUnit }
            : pt,
        ),
      )
      toast({
        title: "Price type updated",
        description: "The price type has been successfully updated.",
      })
    } else {
      // Create new price type
      const newPriceType: PriceType = {
        id: Date.now().toString(),
        categoryId: selectedCategoryId,
        categoryName: selectedCategory.name,
        unit: selectedUnit,
        createdBy: "Admin",
        createdAt: new Date().toISOString().split("T")[0],
      }
      setPriceTypes([...priceTypes, newPriceType])
      toast({
        title: "Price type created",
        description: "The new price type has been successfully created.",
      })
    }

    setSelectedCategoryId("")
    setSelectedUnit("")
    setEditingPriceType(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (priceType: PriceType) => {
    setEditingPriceType(priceType)
    setSelectedCategoryId(priceType.categoryId)
    setSelectedUnit(priceType.unit)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setPriceTypes(priceTypes.filter((pt) => pt.id !== id))
    toast({
      title: "Price type deleted",
      description: "The price type has been successfully deleted.",
    })
  }

  const openCreateDialog = () => {
    setEditingPriceType(null)
    setSelectedCategoryId("")
    setSelectedUnit("")
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Price Types</h1>
          <p className="text-gray-600">Manage pricing units for different product categories</p>
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
              <DialogTitle>{editingPriceType ? "Edit Price Type" : "Create New Price Type"}</DialogTitle>
              <DialogDescription>
                {editingPriceType
                  ? "Update the price type information below."
                  : "Add a new pricing unit for a product category."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Quantity Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit} required>
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
                      <strong>Preview:</strong> Price will be displayed as "per {selectedUnit}"
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingPriceType ? "Update Price Type" : "Create Price Type"}</Button>
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
          <CardDescription>Total price types: {priceTypes.length}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="hidden md:table-cell">Display Format</TableHead>
                <TableHead className="hidden lg:table-cell">Created By</TableHead>
                <TableHead className="hidden lg:table-cell">Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceTypes.map((priceType) => (
                <TableRow key={priceType.id}>
                  <TableCell>
                    <Badge variant="secondary">{priceType.categoryName}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {priceType.unit}
                    <div className="md:hidden mt-1 text-xs text-green-600">per {priceType.unit}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-green-600 font-medium">per {priceType.unit}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{priceType.createdBy}</TableCell>
                  <TableCell className="hidden lg:table-cell">{priceType.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(priceType)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(priceType.id)}>
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
  )
}
