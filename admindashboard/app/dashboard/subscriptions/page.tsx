"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionType {
  id: string
  name: string
  amount: number
  currency: string
  duration: number
  createdBy: string
  createdAt: string
  subscriberCount: number
}

const currencies = ["USD", "EUR", "GBP", "NGN", "KES", "GHS"]

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionType[]>([
    {
      id: "1",
      name: "Basic Plan",
      amount: 9.99,
      currency: "USD",
      duration: 4,
      createdBy: "Admin",
      createdAt: "2024-01-15",
      subscriberCount: 45,
    },
    {
      id: "2",
      name: "Premium Plan",
      amount: 19.99,
      currency: "USD",
      duration: 4,
      createdBy: "Admin",
      createdAt: "2024-01-16",
      subscriberCount: 23,
    },
    {
      id: "3",
      name: "Pro Plan",
      amount: 39.99,
      currency: "USD",
      duration: 12,
      createdBy: "Admin",
      createdAt: "2024-01-17",
      subscriberCount: 12,
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    currency: "USD",
    duration: "",
  })
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingSubscription) {
      // Update existing subscription
      setSubscriptions(
        subscriptions.map((sub) =>
          sub.id === editingSubscription.id
            ? {
                ...sub,
                name: formData.name,
                amount: Number.parseFloat(formData.amount),
                currency: formData.currency,
                duration: Number.parseInt(formData.duration),
              }
            : sub,
        ),
      )
      toast({
        title: "Subscription updated",
        description: "The subscription type has been successfully updated.",
      })
    } else {
      // Create new subscription
      const newSubscription: SubscriptionType = {
        id: Date.now().toString(),
        name: formData.name,
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency,
        duration: Number.parseInt(formData.duration),
        createdBy: "Admin",
        createdAt: new Date().toISOString().split("T")[0],
        subscriberCount: 0,
      }
      setSubscriptions([...subscriptions, newSubscription])
      toast({
        title: "Subscription created",
        description: "The new subscription type has been successfully created.",
      })
    }

    setFormData({ name: "", amount: "", currency: "USD", duration: "" })
    setEditingSubscription(null)
    setIsDialogOpen(false)
  }

  const handleEdit = (subscription: SubscriptionType) => {
    setEditingSubscription(subscription)
    setFormData({
      name: subscription.name,
      amount: subscription.amount.toString(),
      currency: subscription.currency,
      duration: subscription.duration.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setSubscriptions(subscriptions.filter((sub) => sub.id !== id))
    toast({
      title: "Subscription deleted",
      description: "The subscription type has been successfully deleted.",
    })
  }

  const openCreateDialog = () => {
    setEditingSubscription(null)
    setFormData({ name: "", amount: "", currency: "USD", duration: "" })
    setIsDialogOpen(true)
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Types</h1>
          <p className="text-gray-600">Manage subscription plans for farmers and customers</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubscription ? "Edit Subscription" : "Create New Subscription"}</DialogTitle>
              <DialogDescription>
                {editingSubscription
                  ? "Update the subscription information below."
                  : "Add a new subscription type for users."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Subscription Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Basic Plan, Premium Plan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="9.99"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => setFormData({ ...formData, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="4"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    required
                  />
                </div>

                {formData.amount && formData.currency && formData.duration && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Preview:</strong> {formatCurrency(Number.parseFloat(formData.amount), formData.currency)}{" "}
                      for {formData.duration} weeks
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingSubscription ? "Update Subscription" : "Create Subscription"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Subscription Overview
          </CardTitle>
          <CardDescription>Total subscription types: {subscriptions.length}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Duration</TableHead>
                <TableHead className="hidden md:table-cell">Subscribers</TableHead>
                <TableHead className="hidden lg:table-cell">Created By</TableHead>
                <TableHead className="hidden lg:table-cell">Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell className="font-medium">
                    {subscription.name}
                    <div className="md:hidden mt-1 text-xs text-gray-500">{subscription.duration} weeks</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{formatCurrency(subscription.amount, subscription.currency)}</Badge>
                    <div className="md:hidden mt-1 text-xs text-gray-500">{subscription.subscriberCount} users</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{subscription.duration} weeks</TableCell>
                  <TableCell className="hidden md:table-cell">{subscription.subscriberCount} users</TableCell>
                  <TableCell className="hidden lg:table-cell">{subscription.createdBy}</TableCell>
                  <TableCell className="hidden lg:table-cell">{subscription.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(subscription)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(subscription.id)}>
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
