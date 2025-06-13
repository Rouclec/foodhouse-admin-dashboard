import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F6F6F6] to-[#F3F3F3] p-4">
      <div className="bg-primary p-4 rounded-full mb-6">
        <Leaf className="h-12 w-12 text-white" />
      </div>

      <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
      <p className="text-gray-600 text-center max-w-md mb-8">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
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
