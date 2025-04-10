// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles?: string[];
      accessToken?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
    accessToken?: string;
  }
}
