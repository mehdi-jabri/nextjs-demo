// app/auth/signin/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LayoutGrid as EntraIcon } from "lucide-react";

export default function SignInPage() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-md rounded px-8 py-6">
        <h1 className="text-2xl font-bold mb-4 text-center">Sign In</h1>
        <p className="mb-6 text-center text-gray-600">
          Sign in with your Microsoft Entra ID account to access the application.
        </p>
        <div className="flex justify-center">
          <Button
            onClick={() => signIn("microsoft", { redirectTo: "/" })}
            className="flex items-center space-x-2"
          >
            <EntraIcon className="h-5 w-5" />
            <span>Sign in with Microsoft Entra ID</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
