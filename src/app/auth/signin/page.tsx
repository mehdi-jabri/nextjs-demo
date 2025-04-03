"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LayoutGrid as AzureIcon } from "lucide-react"; // Using lucide-react; adjust if you have a custom icon

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if a session exists
  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  if (status === "loading") return <p className="p-4">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded px-8 py-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign In</h1>
        <p className="mb-6 text-center text-gray-600">
          Sign in with your Azure account to access the application.
        </p>
        <Button
          onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
          className="flex items-center space-x-2"
        >
          <AzureIcon className="h-5 w-5" />
          <span>Sign in with Azure AD</span>
        </Button>
      </div>
    </div>
  );
}
