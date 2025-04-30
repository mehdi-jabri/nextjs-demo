// components/navigation/Sidebar.tsx – Chakra UI v3 compliant
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";
import NextImage from "next/image";
import {
  Box,
  Flex,
  Icon,
  Text,
  Button,
  Drawer,
  Portal,
  VStack,
  HStack,
  IconButton,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { signOut, useSession } from "next-auth/react";
import {
  Home as HomeIcon,
  LayoutDashboard,
  Menu as MenuIcon,
  X as XIcon,
  LogOut as LogOutIcon,
} from "lucide-react";

// ⚠️ Avatar is now slot‑based in v3
import { Avatar } from "@chakra-ui/react";

/**
 * App‑level nav items & role‑gating
 */
const navigationItems = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
    roles: ["user", "admin"],
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
] as const;

type Role = "user" | "admin";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // show nothing until auth hydrates or no user
  // if (status === "loading" || !session) return null;
  //
  // const { user } = session;

  // const hasRole = (roles: readonly Role[]) =>
  //   user.roles ? roles.some((r) => user.roles!.includes(r)) : false;
  //
  // const isActive = (href: string) =>
  //   href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => signOut({ redirectTo: "/auth/signin" });

  const NavLinks = () => (
    <VStack as="nav" align="stretch" gap="1" px="2" flex="1">
      {navigationItems.map((item) => {
        // if (!hasRole(item.roles)) return null;
        return (
          <Button
            key={item.name}
            asChild
            // variant={isActive(item.href) ? "subtle" : "ghost"}
            justifyContent="flex-start"
          >
            <NextLink href={item.href}><Icon as={item.icon} boxSize="5" color="fg.muted" /><Icon as={item.icon} boxSize="5" color="fg.muted" />{item.name}</NextLink>
          </Button>
        );
      })}
    </VStack>
  );

  const UserSection = () => (
    <Box borderTopWidth="1px" borderColor="border" px="4" py="3">
      {/*<HStack>*/}
      {/*  <Avatar.Root size="sm">*/}
      {/*    <Avatar.Image src={user.image ?? "/default-avatar.png"} />*/}
      {/*    <Avatar.Fallback name={user.name ?? "Guest"} />*/}
      {/*  </Avatar.Root>*/}
      {/*  <Box>*/}
      {/*    <Text fontWeight="medium" lineClamp="1">*/}
      {/*      {user.name}*/}
      {/*    </Text>*/}
      {/*    <Text textStyle="xs" color="fg.muted" lineClamp="1">*/}
      {/*      {user.email}*/}
      {/*    </Text>*/}
      {/*  </Box>*/}
      {/*</HStack>*/}
      <Button
        mt="3"
        w="full"
        colorPalette="red"
        onClick={handleLogout}
      >
        <LogOutIcon size={16} />
      </Button>
    </Box>
  );

  const SidebarContent = () => (
    <Flex direction="column" w="64" bg="bg" borderRightWidth="1px" minH="100dvh">
      <Flex align="center" px="4" py="4">
        <ChakraLink asChild>
          <NextLink href="/">
            <Box asChild>
              <NextImage src="/logo.svg" alt="Logo" width={60} height={60} />
            </Box>
          </NextLink>
        </ChakraLink>
      </Flex>

      <NavLinks />
      <UserSection />
    </Flex>
  );

  return (
    <>
      <Box display={{ base: "block", sm: "none" }}>
        <Flex px="4" py="2" align="center" borderBottomWidth="1px" bg="bg">
          <IconButton
            variant="ghost"
            aria-label="Open sidebar"
            onClick={() => setMobileOpen(true)}
          >
            <Icon as={MenuIcon} boxSize="6" />
          </IconButton>
          <Box flex="1" display="flex" justifyContent="center">
            <ChakraLink asChild>
              <NextLink href="/">
                <Box asChild>
                  <NextImage src="/logo.svg" alt="Logo" width={40} height={40} />
                </Box>
              </NextLink>
            </ChakraLink>
          </Box>
          <Box w="6" />
        </Flex>

        <Drawer.Root open={mobileOpen} onOpenChange={(e) => setMobileOpen(e.open)} size="xs">
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content >
                <Drawer.Header px="4" py="2">
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Menu</Text>
                    <IconButton
                      variant="ghost"
                      aria-label="Close sidebar"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon as={XIcon} boxSize="6" />
                    </IconButton>
                  </HStack>
                </Drawer.Header>
                <Drawer.Body p="0">
                  <SidebarContent />
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </Box>

      <Box hideBelow="sm">
        <SidebarContent />
      </Box>
    </>
  );
}
