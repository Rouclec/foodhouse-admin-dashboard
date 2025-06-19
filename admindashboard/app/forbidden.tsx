import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export default function Forbidden() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F6F6F6] to-[#F3F3F3] p-4">
      <div className="bg-destructive p-4 rounded-full mb-6">
        <ShieldAlert className="h-12 w-12 text-white" />
      </div>

      <h1 className="text-6xl font-bold text-gray-900 mb-2">403</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Access Forbidden</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        You don't have permission to access this page. Please contact your administrator if you believe this is an
        error.
      </p>

      <div className="space-x-4">
        <Button asChild>
          <Link href="/">Go to Dashboard</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  )
}
