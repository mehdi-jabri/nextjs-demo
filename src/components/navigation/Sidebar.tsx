// components/navigation/ResponsiveSidebar.tsx
"use client"; // Needed for hooks like useDisclosure, usePathname, useSession

import { usePathname } from "next/navigation";
import { Link as NextLink } from "next/link"; // For Next.js routing
import { signOut, useSession } from "next-auth/react";
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  HStack,
  Icon,
  IconButton,
  Image,
  Link, // Chakra UI Link
  Text,
  VStack,
  useDisclosure,
  // SimpleGrid, // Could be used for complex layouts if needed
  // Heading, // Use if sections need titles
} from "@chakra-ui/react";
import {
  Home,       // Example Icon
  Settings,   // Example Icon
  UserCircle, // Example Icon for a profile section
  LogOut,
  Menu as MenuIcon,
} from "lucide-react"; // Using lucide-react for icons
import { ReactNode } from "react";

// Define the structure for navigation items
interface NavItemProps {
  icon: ReactNode;
  name: string;
  href: string;
}

// List of navigation items
const NavItems: NavItemProps[] = [
  { name: "Home", icon: <Icon as={Home} />, href: "/" },
  { name: "Settings", icon: <Icon as={Settings} />, href: "/settings" },
  { name: "Profile", icon: <Icon as={UserCircle} />, href: "/profile" },
  // Add more navigation items here
];

// --- Reusable Sidebar Content ---
// This component contains the actual visual structure of the sidebar
const SidebarContent = ({ onClose }: { onClose?: () => void }) => {
  const pathname = usePathname();
  const { data: session } = useSession(); // Get session data

  // Don't render user info if no session (shouldn't happen if parent checks, but safe)
  const user = session?.user;

  const handleLogout = () => {
    signOut({ callbackUrl: "/auth/signin" }); // Redirect to signin after logout
  };

  const isActive = (href: string) => pathname === href;

  return (
    <Flex
      direction="column"
      h="100%" // Full height of its container (DrawerBody or desktop Box)
      bg="gray.50" // Slightly off-white background
      _dark={{ bg: "gray.800" }} // Dark mode background
      borderRightWidth="1px"
      borderColor="gray.200"
      _dark={{ borderColor: "gray.700" }}
    >
      {/* Logo Area */}
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Link as={NextLink} href="/" onClick={onClose}>
          <Image src="/logo.svg" alt="App Logo" boxSize="40px" />
          {/* Optionally add Text Logo */}
          {/* <Text fontSize="2xl" fontWeight="bold" ml="2">MyApp</Text> */}
        </Link>
        {/* Close button can be placed here too if not using DrawerCloseButton */}
      </Flex>

      {/* Navigation Items Area */}
      <VStack
        as="nav"
        spacing={1} // Minimal spacing between items
        align="stretch" // Make items take full width
        flex="1" // Takes up remaining vertical space
        overflowY="auto" // Add scroll if items overflow
        px={4} // Padding for the navigation items
      >
        {NavItems.map((item) => (
          <Link
            key={item.name}
            as={NextLink}
            href={item.href}
            passHref
            style={{ textDecoration: 'none' }}
            onClick={onClose} // Close drawer when a link is clicked
            _focus={{ boxShadow: 'none' }}
          >
            <Flex
              align="center"
              p="3" // Padding inside each nav item
              mx="2"
              borderRadius="lg"
              role="group"
              cursor="pointer"
              bg={isActive(item.href) ? "blue.400" : "transparent"}
              color={isActive(item.href) ? "white" : "gray.600"}
              fontWeight={isActive(item.href) ? "bold" : "normal"}
              _dark={{
                color: isActive(item.href) ? "white" : "gray.200"
              }}
              _hover={{
                bg: "blue.300",
                color: "white",
              }}
            >
              {item.icon && (
                <Box
                  mr="4" // Space between icon and text
                  fontSize="16" // Icon size
                  _groupHover={{ color: 'white' }} // Ensure icon color matches text on hover
                >
                  {item.icon}
                </Box>
              )}
              {item.name}
            </Flex>
          </Link>
        ))}
      </VStack>

      {/* Divider */}
      <Divider borderColor="gray.200" _dark={{ borderColor: "gray.700" }} />

      {/* User Info & Logout Area */}
      {user && ( // Only show if user session exists
        <Box p={4}>
          <HStack spacing={3} mb={4} align="center">
            <Avatar size="sm" name={user.name ?? ""} src={user.image ?? undefined} />
            <VStack align="start" spacing={0} lineHeight="tight">
              <Text fontSize="sm" fontWeight="medium">
                {user.name ?? "User"}
              </Text>
              <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
                {user.email}
              </Text>
            </VStack>
          </HStack>
          <Button
            colorScheme="red" // Use semantic colors
            variant="outline" // Or "ghost" or "solid"
            width="full"
            leftIcon={<Icon as={LogOut} boxSize={4} />}
            onClick={handleLogout}
          >
            Log out
          </Button>
        </Box>
      )}
    </Flex>
  );
};

// --- Main Responsive Sidebar Component ---
export default function ResponsiveSidebar() {
  // Hook for controlling Drawer state (isOpen, onOpen, onClose)
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { status } = useSession(); // Check session status

  // Basic loading/unauthenticated state (can be customized)
  if (status === "loading") {
    return <Box p={4}>Loading session...</Box>; // Or a Spinner
  }
  if (status === "unauthenticated") {
    // Depending on your app logic, you might render null or redirect,
    // or maybe show a login prompt instead of the sidebar.
    // Returning null here assumes sidebar is only for authenticated users.
    return null;
  }


  return (
    <Box>
      {/* --- Mobile View --- */}
      {/* Hamburger menu button shown only on smaller screens (base to md) */}
      <IconButton
        display={{ base: "flex", md: "none" }} // Show on mobile, hide on desktop
        onClick={onOpen} // Open the Drawer
        variant="outline"
        aria-label="Open menu"
        icon={<Icon as={MenuIcon} />}
        position="fixed" // Keep it visible
        top="4"
        left="4"
        zIndex="overlay" // Ensure it's above other content
        bg="whiteAlpha.800" // Semi-transparent background
        _dark={{ bg: "gray.700" }}
      />

      {/* Mobile Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="left"
        onClose={onClose}
        returnFocusOnClose={false} // Optional: depends on desired focus behavior
        onOverlayClick={onClose}   // Close drawer when clicking overlay
        size="xs"                 // Adjust size as needed (xs, sm, md, etc.)
      >
        <DrawerOverlay /> {/* Dims the background */}
        <DrawerContent>
          <DrawerCloseButton /> {/* Standard 'X' button */}
          <DrawerBody p={0}> {/* Remove padding, content handles it */}
            <SidebarContent onClose={onClose} /> {/* Render shared content */}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* --- Desktop View --- */}
      {/* Sidebar content shown directly on larger screens (md and up) */}
      <Box
        display={{ base: "none", md: "flex" }} // Hide on mobile, show on desktop
        w={{ base: "full", md: 60 }} // Full width on mobile (if shown), fixed width on desktop
        // For a sidebar that stays fixed on scroll:
        // pos="fixed"
        // h="full"
        // top="0"
        // left="0"
        // zIndex="sticky"
      >
        <SidebarContent /> {/* Render shared content directly */}
      </Box>

      {/* Reminder: Your main page content needs to account for the desktop sidebar */}
      {/* e.g., in your main layout wrapper: */}
      {/* <Box ml={{ base: 0, md: 60 }} p="4"> */}
      {/* {children} */}
      {/* </Box> */}
    </Box>
  );
}
