"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingCart,
  User,
  Leaf,
  MapPin,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OrderLog {
  id: string
  status: string
  timestamp: string
  note: string
  by: string
}

interface OrderProduct {
  id: string
  name: string
  quantity: number
  unit: string
  price: number
}

interface Order {
  id: string
  customer: {
    name: string
    phone: string
    email: string
    address: string
  }
  farmer: {
    name: string
    phone: string
    farmName: string
    location: string
  }
  agent: {
    name: string
    phone: string
    email: string
    rating: number
    completedOrders: number
  }
  products: OrderProduct[]
  status: "pending" | "accepted" | "in-transit" | "delivered" | "cancelled"
  amount: number
  deliveryFee: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: "paid" | "pending" | "failed"
  deliveryPoint: string
  placedAt: string
  logs: OrderLog[]
}

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call to fetch order details
    const fetchOrder = () => {
      setIsLoading(true)
      setTimeout(() => {
        // Mock data for the order
        const mockOrder: Order = {
          id: params.id as string,
          customer: {
            name: "John Doe",
            phone: "+1234567890",
            email: "john@example.com",
            address: "123 Main St, Lagos",
          },
          farmer: {
            name: "Sarah Wilson",
            phone: "+2345678901",
            farmName: "Green Valley Farm",
            location: "Ikeja, Lagos",
          },
          agent: {
            name: "Michael Johnson",
            phone: "+3456789012",
            email: "michael@foodhouse.com",
            rating: 4.8,
            completedOrders: 156,
          },
          products: [
            { id: "1", name: "Tomatoes", quantity: 5, unit: "kg", price: 12.5 },
            { id: "2", name: "Lettuce", quantity: 2, unit: "kg", price: 8.0 },
            { id: "3", name: "Carrots", quantity: 3, unit: "kg", price: 6.75 },
          ],
          status: "in-transit",
          amount: 27.25,
          deliveryFee: 5.0,
          totalAmount: 32.25,
          paymentMethod: "Card Payment",
          paymentStatus: "paid",
          deliveryPoint: "Lagos Island Hub",
          placedAt: "2024-06-12T14:30:00Z",
          logs: [
            {
              id: "1",
              status: "pending",
              timestamp: "2024-06-12T14:30:00Z",
              note: "Order placed by customer",
              by: "System",
            },
            {
              id: "2",
              status: "accepted",
              timestamp: "2024-06-12T15:15:00Z",
              note: "Order accepted by farmer",
              by: "Sarah Wilson (Farmer)",
            },
            {
              id: "3",
              status: "in-transit",
              timestamp: "2024-06-12T16:45:00Z",
              note: "Order picked up by delivery agent",
              by: "Michael Johnson (Agent)",
            },
          ],
        }
        setOrder(mockOrder)
        setIsLoading(false)
      }, 800)
    }

    fetchOrder()
  }, [params.id])

  const handleContactViaWhatsApp = (phone: string, name: string, role: string) => {
    const message = encodeURIComponent(
      `Hello ${name}! I'm contacting you from FoodHouse admin team regarding order ${params.id}. How can I assist you?`,
    )
    const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${message}`
    window.open(whatsappUrl, "_blank")

    toast({
      title: `Contacting ${role}`,
      description: `Opening WhatsApp chat with ${name}`,
    })
  }

  const handleCall = (phone: string, name: string, role: string) => {
    window.location.href = `tel:${phone}`

    toast({
      title: `Calling ${role}`,
      description: `Initiating call to ${name} at ${phone}`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "in-transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Loading order information...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-2 text-gray-600">Loading order details...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Not Found</h1>
            <p className="text-gray-600">The requested order could not be found.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order {order.id}</h1>
            <div className="flex items-center mt-1">
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              <span className="mx-2 text-gray-500">•</span>
              <span className="text-sm text-gray-600">{formatDate(order.placedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
          <Badge variant="outline">{order.paymentMethod}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Summary
            </CardTitle>
            <CardDescription>Order details and products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Products</h3>
                <div className="mt-3 border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.products.map((product) => (
                        <tr key={product.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                            {product.quantity} {product.unit}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${(product.quantity * product.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          Subtotal
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          ${order.amount.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          Delivery Fee
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          ${order.deliveryFee.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          Total
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium">Delivery Information</h3>
                <div className="mt-3 flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-gray-700">{order.deliveryPoint}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Timeline */}
        <Card className="lg:row-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Order Timeline
            </CardTitle>
            <CardDescription>Status updates and history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <ol className="relative border-l border-gray-200 ml-3">
                {order.logs.map((log, index) => (
                  <li key={log.id} className="mb-6 ml-6">
                    <span
                      className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white ${
                        index === 0 ? "bg-green-200" : "bg-blue-200"
                      }`}
                    >
                      {index === 0 ? (
                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                      ) : (
                        <Clock className="w-3 h-3 text-blue-600" />
                      )}
                    </span>
                    <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-center mb-1">
                        <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                        <time className="text-xs text-gray-500">{formatDate(log.timestamp)}</time>
                      </div>
                      <p className="text-sm font-normal text-gray-700">{log.note}</p>
                      <p className="text-xs text-gray-500 mt-1">By: {log.by}</p>
                    </div>
                  </li>
                ))}
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <li className="ml-6">
                    <span className="absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white bg-gray-100">
                      <AlertCircle className="w-3 h-3 text-gray-500" />
                    </span>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                      <p className="text-sm font-normal text-gray-500">Awaiting next update...</p>
                    </div>
                  </li>
                )}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* People Involved */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>People Involved</CardTitle>
            <CardDescription>Contact information for all parties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Customer */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-blue-100 text-blue-800">{order.customer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium flex items-center">
                        <User className="h-4 w-4 mr-1 text-blue-600" />
                        Customer
                      </h3>
                      <p className="text-base font-medium">{order.customer.name}</p>
                      <p className="text-sm text-gray-500">{order.customer.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactViaWhatsApp(order.customer.phone, order.customer.name, "Customer")}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCall(order.customer.phone, order.customer.name, "Customer")}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>

              {/* Farmer */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-green-100 text-green-800">{order.farmer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium flex items-center">
                        <Leaf className="h-4 w-4 mr-1 text-green-600" />
                        Farmer
                      </h3>
                      <p className="text-base font-medium">{order.farmer.name}</p>
                      <p className="text-sm text-gray-500">{order.farmer.farmName}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactViaWhatsApp(order.farmer.phone, order.farmer.name, "Farmer")}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCall(order.farmer.phone, order.farmer.name, "Farmer")}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>

              {/* Delivery Agent */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-purple-100 text-purple-800">{order.agent.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium flex items-center">
                        <Truck className="h-4 w-4 mr-1 text-purple-600" />
                        Delivery Agent
                      </h3>
                      <p className="text-base font-medium">{order.agent.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="flex items-center mr-3">
                          <svg
                            className="w-4 h-4 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                          </svg>
                          {order.agent.rating}
                        </span>
                        <span>{order.agent.completedOrders} orders completed</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactViaWhatsApp(order.agent.phone, order.agent.name, "Agent")}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCall(order.agent.phone, order.agent.name, "Agent")}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
