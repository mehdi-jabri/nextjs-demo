import React, { ReactNode } from 'react';
import {
Table,
TableHeader,
TableBody,
TableFooter,
TableHead,
TableRow,
TableCell,
TableCaption,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Interface for defining table headers dynamically
export interface HeaderDefinition<T> {
key: keyof T | string; // Allow string for potentially nested keys later, though keep simple for now
label: string;          // Display label for the header
isNumeric?: boolean;    // Should the column be right-aligned?
isDate?: boolean;       // Should the value be formatted as a date?
// Custom formatting function for complex rendering (takes precedence over isDate)
// Receives the specific cell value and the entire row item
formatFn?: (value: any, item: T) => ReactNode;
// Optional class name for the TableCell
cellClassName?: string;
// Optional class name for the TableHead
headerClassName?: string;
}

interface TransactionTableProps<T extends Record<string, any>> {
transactions: T[];                // Array of data objects (generic type)
headers: HeaderDefinition<T>[];   // Array of header definitions
caption: string;                  // Table caption
}

// Generic component signature
const TransactionTable = <T extends Record<string, any>>({
transactions,
headers,
caption,
}: TransactionTableProps<T>) => {

// Helper function to get nested values if needed (simple version for now)
// For keys like 'user.name', this would need enhancing
const getValue = (item: T, key: keyof T | string): any => {
return item[key as keyof T];
};

// Helper function to format cell content based on header definition
const formatCell = (item: T, header: HeaderDefinition<T>): ReactNode => {
const value = getValue(item, header.key);

    // Handle null or undefined values gracefully
    if (value === null || typeof value === 'undefined') {
      return <span className="text-muted-foreground">-</span>; // Placeholder for empty cells
    }

    // Priority 1: Custom format function
    if (header.formatFn) {
      return header.formatFn(value, item);
    }

    // Priority 2: Date formatting
    if (header.isDate) {
      try {
        // Basic date formatting, consider adding locale options if needed
        return new Date(value).toLocaleDateString(undefined, { // Use user's locale
           year: 'numeric', month: 'short', day: 'numeric'
        });
      } catch (e) {
        console.error(`Error formatting date for value: ${value}`, e);
        return <span className="text-red-500 italic">Invalid Date</span>; // Indicate formatting error
      }
    }

    // Priority 3: Default rendering (convert basic types to string)
    if (typeof value === 'object') {
        // Avoid rendering [object Object] - might need specific handling or formatFn
        return JSON.stringify(value);
    }

    return String(value);
};

// Render logic for empty state
if (transactions.length === 0) {
return <p className="text-center text-muted-foreground py-6 px-4">{caption} - No data available.</p>;
}

// Render the table
return (
<div className="border rounded-md overflow-hidden"> {/* Added overflow-hidden */}
<Table>
<TableCaption className="py-4">{caption}</TableCaption>
<TableHeader>
<TableRow>
{headers.map((header) => (
<TableHead
key={String(header.key)}
className={cn(
header.isNumeric ? 'text-right' : '',
header.headerClassName // Apply optional header class
)}
>
{header.label}
</TableHead>
))}
</TableRow>
</TableHeader>
<TableBody>
{transactions.map((item, index) => ( // Added index for unique key if item has no ID
<TableRow key={(item.id as string) || `row-${index}`}>
{headers.map((header) => (
<TableCell
key={`${String(header.key)}-${(item.id as string) || index}`}
className={cn(
header.isNumeric ? 'text-right' : '',
header.cellClassName // Apply optional cell class
)}
>
{formatCell(item, header)}
</TableCell>
))}
</TableRow>
))}
</TableBody>
</Table>
</div>
);
};

export default TransactionTable; // Export the refactored component




// ... (imports and other code in AccountDetailsShadcnPage) ...

// Import the refactored table and its header definition type
import TransactionTable, { HeaderDefinition } from './TransactionTable'; // Adjust path if needed

// --- Interfaces (can remain here or move to types file) ---
interface Balance { /* ... */ }
interface Transaction { /* ... */ }

// --- Main Page Component ---
export default function AccountDetailsShadcnPage() {
// ... (state variables: accountId, userName, region, etc.) ...
// ... (state variables: isFetching, error, balance, etc.) ...
const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
const [accountedTransactions, setAccountedTransactions] = useState<Transaction[]>([]);

const { toast } = useToast();

// --- Define Header Configurations ---
const transactionHeaders: HeaderDefinition<Transaction>[] = [
{
key: 'date',
label: 'Date',
isDate: true, // Use built-in date formatting
headerClassName: "w-[120px]", // Example: Set width for header
},
{
key: 'description',
label: 'Description',
cellClassName: "truncate max-w-[300px]" // Example: Apply truncate style to cell
},
{
key: 'amount', // The key in the data object
label: 'Amount ($)', // The display label
isNumeric: true, // Align content to the right
headerClassName: "w-[150px]",
// Custom function to format amount, sign, and currency
formatFn: (value, item) => (
<span className={cn(
'font-semibold', // Common style
item.sign === 'Credit' ? 'text-green-600' : 'text-red-600' // Conditional color
)}>
{item.sign === 'Credit' ? '+' : '-'} {/* Show sign */}
{Number(value).toFixed(2)} {/* Format number */}
{/* Optionally add currency symbol - assumes item has currency key */}
{item.currency ? ` ${item.currency}` : ''}
</span>
),
},
// Example: Add another column if your data had it
// { key: 'status', label: 'Status' },
];

// ... (fetchDataForAccount, handleSubmit, etc. remain largely the same) ...

return (
<div className="container mx-auto max-w-5xl py-10 px-4 space-y-8">
{/* ... (Form Section) ... */}
{/* ... (Loading and Error States) ... */}

       {/* Data Display Area */}
       {!isFetching && !error && (balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && (
          <div className="space-y-8">
            {/* ... (Balance Info Card) ... */}

            {/* Transactions Tabs */}
             <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                   <TabsTrigger value="pending">Pending ({pendingTransactions.length})</TabsTrigger>
                   <TabsTrigger value="accounted">Accounted ({accountedTransactions.length})</TabsTrigger>
                </TabsList>
                <Card className="mt-4 shadow-sm">
                   <CardContent className="p-0">
                      <TabsContent value="pending" className="m-0">
                          {/* Use the refactored TransactionTable */}
                          <TransactionTable
                              transactions={pendingTransactions}
                              headers={transactionHeaders} // Pass defined headers
                              caption="Recent pending transactions."
                          />
                      </TabsContent>
                      <TabsContent value="accounted" className="m-0">
                          {/* Use the refactored TransactionTable */}
                          <TransactionTable
                              transactions={accountedTransactions}
                              headers={transactionHeaders} // Pass defined headers
                              caption="Posted account transactions."
                          />
                      </TabsContent>
                   </CardContent>
                </Card>
             </Tabs>
          </div>
       )}

       {/* ... (Initial Prompt Message) ... */}
    </div>
);
}
