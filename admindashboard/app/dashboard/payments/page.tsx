"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CreditCard, Eye, Download, Calendar, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Payment {
  id: string
  type: "order" | "subscription"
  referenceId: string
  customerName: string
  amount: number
  currency: string
  status: "successful" | "pending" | "failed" | "refunded"
  method: string
  date: string
  details: {
    transactionId?: string
    paymentProvider: string
    cardLast4?: string
    bankName?: string
    accountName?: string
  }
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [payments] = useState<Payment[]>([
    {
      id: "PAY-001",
      type: "order",
      referenceId: "ORD-001",
      customerName: "John Doe",
      amount: 45.99,
      currency: "USD",
      status: "successful",
      method: "Card Payment",
      date: "2024-01-20",
      details: {
        transactionId: "TXN123456789",
        paymentProvider: "Stripe",
        cardLast4: "4242",
      },
    },
    {
      id: "PAY-002",
      type: "subscription",
      referenceId: "SUB-001",
      customerName: "Jane Smith",
      amount: 19.99,
      currency: "USD",
      status: "successful",
      method: "Card Payment",
      date: "2024-01-19",
      details: {
        transactionId: "TXN987654321",
        paymentProvider: "Stripe",
        cardLast4: "5555",
      },
    },
    {
      id: "PAY-003",
      type: "order",
      referenceId: "ORD-003",
      customerName: "Bob Johnson",
      amount: 23.75,
      currency: "USD",
      status: "pending",
      method: "Bank Transfer",
      date: "2024-01-18",
      details: {
        paymentProvider: "Bank",
        bankName: "First Bank",
        accountName: "FoodHouse Ltd",
      },
    },
    {
      id: "PAY-004",
      type: "order",
      referenceId: "ORD-004",
      customerName: "Alice Brown",
      amount: 89.25,
      currency: "USD",
      status: "failed",
      method: "Card Payment",
      date: "2024-01-17",
      details: {
        transactionId: "TXN456789123",
        paymentProvider: "Stripe",
        cardLast4: "1234",
      },
    },
    {
      id: "PAY-005",
      type: "subscription",
      referenceId: "SUB-002",
      customerName: "Charlie Wilson",
      amount: 39.99,
      currency: "USD",
      status: "refunded",
      method: "Card Payment",
      date: "2024-01-16",
      details: {
        transactionId: "TXN789123456",
        paymentProvider: "Stripe",
        cardLast4: "9876",
      },
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter
    const matchesType = typeFilter === "all" || payment.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "successful":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="h-4 w-4" />
      case "subscription":
        return <Calendar className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const viewPaymentDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsDetailsOpen(true)
  }

  const downloadReceipt = (paymentId: string) => {
    toast({
      title: "Receipt downloaded",
      description: `Receipt for payment ${paymentId} has been downloaded.`,
    })
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
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage all payments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, reference or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="successful">Successful</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order">Order Payments</SelectItem>
                <SelectItem value="subscription">Subscription Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Showing {filteredPayments.length} of {payments.length} payments
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Reference</TableHead>
                <TableHead className="hidden md:table-cell">Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Method</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.id}
                    <div className="sm:hidden mt-1 text-xs text-gray-500">Ref: {payment.referenceId}</div>
                    <div className="md:hidden mt-1 text-xs text-gray-500">{payment.customerName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center w-fit gap-1">
                      {getTypeIcon(payment.type)}
                      <span className="capitalize">{payment.type}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{payment.referenceId}</TableCell>
                  <TableCell className="hidden md:table-cell">{payment.customerName}</TableCell>
                  <TableCell>{formatCurrency(payment.amount, payment.currency)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{payment.method}</TableCell>
                  <TableCell className="hidden lg:table-cell">{payment.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPaymentDetails(payment)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.status === "successful" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReceipt(payment.id)}
                          title="Download Receipt"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      {selectedPayment && (
        <dialog
          open={isDetailsOpen}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Payment Details</h3>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-medium">{selectedPayment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{selectedPayment.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reference:</span>
                <span className="font-medium">{selectedPayment.referenceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{selectedPayment.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={getStatusColor(selectedPayment.status)}>{selectedPayment.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-medium">{selectedPayment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">{selectedPayment.date}</span>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-2">Payment Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provider:</span>
                    <span>{selectedPayment.details.paymentProvider}</span>
                  </div>
                  {selectedPayment.details.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span>{selectedPayment.details.transactionId}</span>
                    </div>
                  )}
                  {selectedPayment.details.cardLast4 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Card:</span>
                      <span>**** **** **** {selectedPayment.details.cardLast4}</span>
                    </div>
                  )}
                  {selectedPayment.details.bankName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span>{selectedPayment.details.bankName}</span>
                    </div>
                  )}
                  {selectedPayment.details.accountName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Name:</span>
                      <span>{selectedPayment.details.accountName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
              {selectedPayment.status === "successful" && (
                <Button onClick={() => downloadReceipt(selectedPayment.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  )
}
