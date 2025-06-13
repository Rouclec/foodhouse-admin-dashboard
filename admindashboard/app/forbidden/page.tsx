import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="space-y-6 max-w-md">
        <ShieldAlert className="h-24 w-24 text-red-500 mx-auto" />
        <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-lg text-muted-foreground">
          You don't have permission to access this page. This area is restricted
          to administrators only.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/auth/login">Sign In as Admin</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
