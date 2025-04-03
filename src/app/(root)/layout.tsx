import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/navigation/Sidebar";
import { ProtectedLayout } from "@/components/ProtectedLayout";

export default function RootGroupLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  return (
    <ProtectedLayout>
      <div className="flex min-h-screen bg-gray-50">
        {session && <Sidebar />}
        <main className="flex-1 p-4">{children}</main>
      </div>
    </ProtectedLayout>
  );
}
