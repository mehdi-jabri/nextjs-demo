Okay, absolutely! Let's create a nice-looking page using Next.js (App Router), React, and Chakra UI v3. This page will feature a form, display balance information, and show pending/accounted transactions in tabs with pagination.

Since Chakra UI v3 encourages using snippets and potentially different component structures, I'll use the core @chakra-ui/react components where applicable and assume you might have run npx @chakra-ui/cli snippet add which could provide styled versions or helpers (like potentially for Table or Button). If a specific snippet component is generally preferred (like Toaster which replaced the useToast hook), I'd typically mention it, but for layout, forms, and tabs, the core components are usually fine.

1. Create the Page File

Create a file, for example, app/account-details/page.tsx.

2. Add the Code

TypeScript
````typescript
// app/account-details/page.tsx
'use client'; // This page needs client-side interactivity (state, effects, handlers)

import React, { useState, useCallback, useMemo } from 'react';
import {
Box,
Button,
Container,
FormControl,
FormLabel,
FormErrorMessage,
Input,
VStack,
HStack,
Text,
Heading,
Tabs,
TabList,
TabPanels,
Tab,
TabPanel,
Spinner,
Alert,
AlertIcon,
Flex,
Spacer,
Tag,
Select,
IconButton,
useTheme, // To access theme colors like green/red
SimpleGrid, // Good for simple list items
Divider,
Code, // Just for showing the input value
} from '@chakra-ui/react';
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons'; // Basic icons

// --- Interfaces for API Data ---
interface Balance {
balanceDate: string;
amount: number;
currency: string;
}

interface Transaction {
id: string; // Added an ID for list keys
amount: number;
currency: string;
sign: 'Credit' | 'Debit';
description: string;
date: string;
}

// --- Mock API Functions ---
// Simulates fetching balance data
const fetchBalance = async (accountId: string): Promise<Balance> => {
console.log(`Workspaceing balance for account: ${accountId}`);
await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
// Mock failure sometimes
if (accountId.toLowerCase() === 'error') {
throw new Error('Failed to fetch balance.');
}
// Return mock data
return {
balanceDate: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
amount: Math.random() * 10000,
currency: 'USD',
};
};

// Simulates fetching transaction data
const fetchTransactions = async (
accountId: string,
type: 'pending' | 'accounted'
): Promise<Transaction[]> => {
console.log(`Workspaceing ${type} transactions for account: ${accountId}`);
await new Promise((resolve) => setTimeout(resolve, 1200)); // Simulate network delay

// Mock failure sometimes
if (accountId.toLowerCase() === 'error') {
throw new Error(`Failed to fetch ${type} transactions.`);
}
if (accountId.toLowerCase() === 'empty') {
return [];
}

// Generate mock data
const count = type === 'pending' ? 35 : 78; // Different counts for variety
const transactions: Transaction[] = [];
for (let i = 0; i < count; i++) {
const isCredit = Math.random() > 0.5;
transactions.push({
id: `${type}-${i}-${Date.now()}`,
amount: parseFloat((Math.random() * 500).toFixed(2)),
currency: 'USD',
sign: isCredit ? 'Credit' : 'Debit',
description: `${type === 'pending' ? 'Pending' : 'Completed'} transaction #${i + 1} for something important`,
date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'), // Random date in last 30 days
});
}
return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
};

// --- Helper Components ---

interface PaginatedListProps {
transactions: Transaction[];
itemsPerPage: number;
setItemsPerPage: (value: number) => void;
currentPage: number;
setCurrentPage: (value: number) => void;
}

const PaginatedTransactionList: React.FC<PaginatedListProps> = ({
transactions,
itemsPerPage,
setItemsPerPage,
currentPage,
setCurrentPage,
}) => {
const theme = useTheme(); // Access theme for colors

const totalPages = Math.ceil(transactions.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentItems = transactions.slice(startIndex, endIndex);

const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
setItemsPerPage(Number(event.target.value));
setCurrentPage(1); // Reset to first page on changing items per page
};

const handlePrevPage = () => {
setCurrentPage(Math.max(1, currentPage - 1));
};

const handleNextPage = () => {
setCurrentPage(Math.min(totalPages, currentPage + 1));
};

// Define colors based on sign
const getSignColor = (sign: 'Credit' | 'Debit'): string => {
return sign === 'Credit' ? theme.colors.green[600] : theme.colors.red[600];
};

if (transactions.length === 0) {
return <Text>No transactions found.</Text>;
}

return (
<VStack align="stretch" spacing={4}>
{/* List Items */}
<VStack align="stretch" spacing={3} divider={<Divider />}>
{currentItems.map((tx) => (
<Flex key={tx.id} direction={{ base: 'column', md: 'row' }} gap={2} py={2}>
<Box flex="1">
<Text fontWeight="medium">{tx.description}</Text>
<Text fontSize="sm" color="gray.500">
{new Date(tx.date).toLocaleDateString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric',
})}
</Text>
</Box>
<Text
fontWeight="bold"
color={getSignColor(tx.sign)}
textAlign={{ base: 'left', md: 'right' }}
minW="100px" // Ensure alignment
>
{tx.sign === 'Credit' ? '+' : '-'}
{tx.amount.toFixed(2)} {tx.currency}
</Text>
</Flex>
))}
</VStack>

      {/* Pagination Controls */}
      <Flex justify="space-between" align="center" mt={6} wrap="wrap" gap={4}>
        <HStack>
          <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">Items per page:</Text>
          <Select
            size="sm"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            width="80px" // Fixed width for select
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </Select>
        </HStack>
        <Spacer />
        <HStack>
          <Text fontSize="sm" color="gray.600">
            Page {currentPage} of {totalPages}
          </Text>
          <IconButton
            aria-label="Previous Page"
            icon={<ArrowLeftIcon />}
            size="sm"
            onClick={handlePrevPage}
            isDisabled={currentPage === 1}
          />
          <IconButton
            aria-label="Next Page"
            icon={<ArrowRightIcon />}
            size="sm"
            onClick={handleNextPage}
            isDisabled={currentPage === totalPages}
          />
        </HStack>
      </Flex>
    </VStack>
);
};

// --- Main Page Component ---

export default function AccountDetailsPage() {
const [accountId, setAccountId] = useState('');
const [isFetching, setIsFetching] = useState(false);
const [error, setError] = useState<string | null>(null);

const [balance, setBalance] = useState<Balance | null>(null);
const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
const [accountedTransactions, setAccountedTransactions] = useState<Transaction[]>([]);

// State for pagination
const [pendingPage, setPendingPage] = useState(1);
const [pendingItemsPerPage, setPendingItemsPerPage] = useState(10);
const [accountedPage, setAccountedPage] = useState(1);
const [accountedItemsPerPage, setAccountedItemsPerPage] = useState(10);

const [isTouched, setIsTouched] = useState(false);
const isAccountIdInvalid = accountId.trim() === '';

const handleFetchData = useCallback(async () => {
if (isAccountIdInvalid) {
setIsTouched(true);
return;
}
setIsFetching(true);
setError(null);
setBalance(null); // Clear previous data
setPendingTransactions([]);
setAccountedTransactions([]);
setPendingPage(1); // Reset pagination
setAccountedPage(1);

    try {
      // Fetch all data concurrently
      const [balanceData, pendingData, accountedData] = await Promise.all([
        fetchBalance(accountId),
        fetchTransactions(accountId, 'pending'),
        fetchTransactions(accountId, 'accounted'),
      ]);

      setBalance(balanceData);
      setPendingTransactions(pendingData);
      setAccountedTransactions(accountedData);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsFetching(false);
    }
}, [accountId, isAccountIdInvalid]); // Include isAccountIdInvalid dependency

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
setAccountId(event.target.value);
if (isTouched) { // Reset touched state if user starts typing again
setIsTouched(false);
}
if (error) { // Clear error on new input
setError(null);
}
};

const handleSubmit = (event: React.FormEvent) => {
event.preventDefault(); // Prevent default form submission
setIsTouched(true); // Mark as touched on submit attempt
handleFetchData();
};

return (
<Container maxW="container.xl" py={8}>
<VStack spacing={6} align="stretch">
{/* Form Section */}
<Box p={6} borderWidth={1} borderRadius="md" shadow="sm">
<Heading size="lg" mb={4}>
Account Details
</Heading>
<form onSubmit={handleSubmit}>
<VStack spacing={4} align="stretch">
<FormControl isInvalid={isTouched && isAccountIdInvalid} isRequired>
<FormLabel htmlFor="accountId">Account ID</FormLabel>
<Input
id="accountId"
placeholder="Enter account ID (e.g., 12345, 'error', 'empty')"
value={accountId}
onChange={handleInputChange}
onBlur={() => setIsTouched(true)} // Mark as touched on blur
/>
{isTouched && isAccountIdInvalid && (
<FormErrorMessage>Account ID is required.</FormErrorMessage>
)}
</FormControl>
<Button
type="submit"
colorScheme="blue" // Changed to blue for better contrast
isLoading={isFetching}
loadingText="Fetching..."
isDisabled={isFetching} // Disable while fetching
>
Fetch Details
</Button>
</VStack>
</form>
</Box>

        {/* Loading State */}
        {isFetching && (
          <Flex justify="center" py={10}>
            <Spinner size="xl" thickness='4px' color="blue.500" />
          </Flex>
        )}

        {/* Error Display */}
        {error && !isFetching && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Data Display Area (only if not fetching and no error, or if data exists) */}
        {!isFetching && !error && (balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && (
          <VStack spacing={6} align="stretch">
            {/* Balance Info - Top Right */}
            {balance && (
               <Flex justify="flex-end">
                  <Box textAlign="right" p={4} borderWidth={1} borderRadius="md" shadow="xs">
                    <Heading size="sm" color="gray.500">Current Balance</Heading>
                    <Text fontSize="2xl" fontWeight="bold">
                      {balance.amount.toLocaleString(undefined, { style: 'currency', currency: balance.currency })}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      As of {new Date(balance.balanceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Text>
                  </Box>
               </Flex>
            )}

            {/* Transactions Tabs - Middle */}
            <Tabs isFitted variant="enclosed-colored" colorScheme="gray">
              <TabList>
                <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Pending ({pendingTransactions.length})</Tab>
                <Tab _selected={{ color: 'white', bg: 'blue.500' }}>Accounted ({accountedTransactions.length})</Tab>
              </TabList>
              <TabPanels bg="white" borderWidth={1} borderTopWidth={0} borderRadius="md" borderTopRadius={0} p={6} shadow="sm">
                <TabPanel>
                  <PaginatedTransactionList
                    transactions={pendingTransactions}
                    itemsPerPage={pendingItemsPerPage}
                    setItemsPerPage={setPendingItemsPerPage}
                    currentPage={pendingPage}
                    setCurrentPage={setPendingPage}
                  />
                </TabPanel>
                <TabPanel>
                  <PaginatedTransactionList
                    transactions={accountedTransactions}
                    itemsPerPage={accountedItemsPerPage}
                    setItemsPerPage={setAccountedItemsPerPage}
                    currentPage={accountedPage}
                    setCurrentPage={setAccountedPage}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        )}

         {/* Display input if no data is shown yet and not fetching/error */}
         {!isFetching && !error && !(balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && accountId && (
             <Text textAlign="center" color="gray.500" mt={4}>Fetching data for Account ID: <Code>{accountId}</Code></Text>
         )}
         {!isFetching && !error && !(balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && !accountId && (
             <Text textAlign="center" color="gray.500" mt={4}>Enter an Account ID and click "Fetch Details".</Text>
         )}

      </VStack>
    </Container>
);
}
````

Explanation:

'use client': Essential because this page uses React hooks (useState, useCallback, etc.) and handles user interactions.
State Variables: We manage the input (accountId), loading state (isFetching), errors (error), API data (balance, pendingTransactions, accountedTransactions), and pagination state for each list.
Interfaces: Define types for the expected API responses (Balance, Transaction).
Mock API Functions: WorkspaceBalance and WorkspaceTransactions simulate network requests using async/await and setTimeout. They also include logic to return errors or empty arrays based on the input "accountId" (try typing error or empty).
handleFetchData: This function orchestrates the data fetching:
Sets loading state, clears previous data/errors.
Calls the mock API functions concurrently using Promise.all.
Updates state with the fetched data or catches errors.
Resets pagination to page 1 when new data is fetched.
Form (<form onSubmit={...}>):
Uses Chakra's FormControl, FormLabel, Input, FormErrorMessage, and Button.
Basic validation ensures the input is not empty before fetching. isTouched state helps show validation errors only after interaction.
The button shows a loading state and is disabled during fetching.
Balance Display:
Uses a Flex container with justify="flex-end" to position the balance Box to the right.
Formats the currency using toLocaleString.
Conditionally rendered only if balance data exists.
Transactions Tabs:
Uses Chakra's Tabs, TabList, TabPanels, Tab, TabPanel.
The isFitted prop makes tabs take up equal width. variant="enclosed-colored" provides a nice visual style.
_selected prop styles the active tab.
Tab titles show the count of transactions.
PaginatedTransactionList Component:
This reusable component handles the display and pagination logic for a list of transactions.
Calculates which items to show based on currentPage and itemsPerPage.
Renders the list items using Flex for layout and Text for details. Uses theme colors for Credit/Debit amounts.
Provides controls (Select for items per page, IconButtons for navigation).
Conditional Rendering: The balance and tabs sections are only rendered when not fetching, there's no error, and some data has been successfully fetched (balance || pendingTransactions.length > 0 || accountedTransactions.length > 0). Loading spinners and error alerts handle intermediate states. A message prompts the user if no data is loaded yet.
Styling: Uses Chakra UI's props (p, mb, spacing, borderWidth, borderRadius, shadow, colorScheme, etc.) for layout and appearance.
To Use:

Make sure you have Chakra UI set up in your Next.js project as discussed previously (Provider in layout.tsx, etc.).
Save the code above as app/account-details/page.tsx.
Run your Next.js development server (npm run dev or pnpm dev).
Navigate to /account-details in your browser.
Enter an Account ID (e.g., 123, test, error, empty) and click "Fetch Details".
This provides a functional and reasonably styled page structure. You can further customize the appearance using Chakra UI's extensive styling props and theme capabilities!
