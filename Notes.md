npx shadcn-ui@latest add button input label card tabs table select separator alert toast lucide-react



```typescript
// app/account-details-shadcn/page.tsx
'use client';

import React, { useState, useCallback, FormEvent } from 'react';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import { Toaster } from '@/components/ui/toaster'; // Keep Toaster import in layout.tsx

// Icons from lucide-react
import { Loader2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Interfaces (remain the same) ---
interface Balance {
  balanceDate: string;
  amount: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  sign: 'Credit' | 'Debit';
  description: string;
  date: string;
}

// --- Mock API Functions (remain the same) ---
// These still only use accountId for simplicity, but the form now has more fields
const fetchBalance = async (accountId: string): Promise<Balance> => {
  console.log(`Workspaceing balance for account: ${accountId}`);
  await new Promise((resolve) => setTimeout(resolve, 800));
  if (accountId.toLowerCase() === 'error') throw new Error('Failed to fetch balance.');
  return {
    balanceDate: new Date().toLocaleDateString('en-CA'),
    amount: Math.random() * 10000,
    currency: 'USD',
  };
};

const fetchTransactions = async (accountId: string, type: 'pending' | 'accounted'): Promise<Transaction[]> => {
  console.log(`Workspaceing ${type} transactions for account: ${accountId}`);
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (accountId.toLowerCase() === 'error') throw new Error(`Failed to fetch ${type} transactions.`);
  if (accountId.toLowerCase() === 'empty') return [];
  // Limit generated data as pagination is removed
  const count = type === 'pending' ? 15 : 25;
  const transactions: Transaction[] = Array.from({ length: count }, (_, i) => {
    const isCredit = Math.random() > 0.5;
    return {
      id: `${type}-${i}-${Date.now()}`,
      amount: parseFloat((Math.random() * 500).toFixed(2)),
      currency: 'USD',
      sign: isCredit ? 'Credit' : 'Debit',
      description: `${type === 'pending' ? 'Pending' : 'Completed'} transaction #${i + 1}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
    };
  });
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// --- Helper Components ---

interface TransactionTableProps {
  transactions: Transaction[];
  caption: string;
}

// Renamed and simplified: No pagination props/logic
const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  caption,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  if (transactions.length === 0) {
    return <p className="text-center text-muted-foreground py-6 px-4">{caption} - No transactions found.</p>;
  }

  return (
    <div className="border rounded-md"> {/* Add border around the table */}
      <Table>
        <TableCaption className="py-4">{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right w-[150px]">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-medium whitespace-nowrap">{formatDate(tx.date)}</TableCell>
              <TableCell className="truncate max-w-[300px]">{tx.description}</TableCell> {/* Prevent overly long descriptions */}
              <TableCell
                className={cn(
                  'text-right font-semibold',
                  tx.sign === 'Credit' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {tx.sign === 'Credit' ? '+' : '-'}
                {tx.amount.toFixed(2)} {tx.currency}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

// --- Main Page Component ---

export default function AccountDetailsShadcnPage() {
  // Form state using useState
  const [accountId, setAccountId] = useState('');
  const [userName, setUserName] = useState('');
  const [region, setRegion] = useState(''); // For the Select component

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null); // Specific error for form validation

  // Data state
  const [balance, setBalance] = useState<Balance | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [accountedTransactions, setAccountedTransactions] = useState<Transaction[]>([]);

  const { toast } = useToast(); // Initialize useToast hook

  // Clear data when form inputs change (optional, depends on desired UX)
  const handleInputChange = () => {
    setBalance(null);
    setPendingTransactions([]);
    setAccountedTransactions([]);
    setError(null); // Clear API error on input change
    setFormError(null); // Clear form error on input change
  };

  const fetchDataForAccount = useCallback(async (id: string) => {
    setIsFetching(true);
    setError(null);
    setBalance(null); // Clear previous data
    setPendingTransactions([]);
    setAccountedTransactions([]);

    try {
      const [balanceData, pendingData, accountedData] = await Promise.all([
        fetchBalance(id),
        fetchTransactions(id, 'pending'),
        fetchTransactions(id, 'accounted'),
      ]);
      setBalance(balanceData);
      setPendingTransactions(pendingData);
      setAccountedTransactions(accountedData);
      toast({ // Success Toast
        title: "Data Fetched Successfully",
        description: `Showing details for Account ID: ${id}`,
        variant: "default", // or remove for default style
        action: <CheckCircle className="text-green-500" />,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'An unknown error occurred during fetching.';
      setError(errorMessage);
      toast({ // Error Toast
        title: "Error Fetching Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  }, [toast]); // Add toast to dependencies

  // Form submission handler using basic validation
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null); // Clear previous form error

    // Basic validation
    if (!accountId.trim()) {
      setFormError('Account ID cannot be empty.');
      return;
    }
    if (!userName.trim()) {
      setFormError('User Name cannot be empty.');
      return;
    }
     if (!region) {
      setFormError('Please select a Region.');
      return;
    }

    // If valid, proceed to fetch
    console.log('Form submitted with:', { accountId, userName, region });
    fetchDataForAccount(accountId);
  };

  return (
    <div className="container mx-auto max-w-5xl py-10 px-4 space-y-8">
      {/* Form Section */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Account Details Filter</CardTitle>
          <CardDescription>Enter details below to fetch account information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account ID Input */}
            <div className="space-y-2">
              <Label htmlFor="accountId">Account ID <span className="text-red-500">*</span></Label>
              <Input
                id="accountId"
                placeholder="e.g., 12345, 'error', 'empty'"
                value={accountId}
                onChange={(e) => { setAccountId(e.target.value); handleInputChange(); }}
              />
            </div>

            {/* User Name Input */}
            <div className="space-y-2">
              <Label htmlFor="userName">User Name <span className="text-red-500">*</span></Label>
              <Input
                id="userName"
                placeholder="e.g., John Doe"
                value={userName}
                onChange={(e) => { setUserName(e.target.value); handleInputChange(); }}
              />
            </div>

            {/* Region Select */}
            <div className="space-y-2">
              <Label htmlFor="region">Region <span className="text-red-500">*</span></Label>
              <Select value={region} onValueChange={(value) => { setRegion(value); handleInputChange(); }}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select region..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amer">AMER</SelectItem>
                  <SelectItem value="apac">APAC</SelectItem>
                  <SelectItem value="emea">EMEA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Form Error and Submit Button */}
            <div className="md:col-span-3 space-y-4">
               {formError && (
                  <Alert variant="destructive" className="text-sm">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>Validation Error</AlertTitle>
                     <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
              <Button type="submit" disabled={isFetching} className="w-full md:w-auto">
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Fetch Details'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading State - More prominent */}
      {isFetching && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-muted rounded-lg shadow-inner">
           <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
           <p className="text-lg font-medium text-muted-foreground">Loading account data...</p>
           <p className="text-sm text-muted-foreground">Please wait a moment.</p>
        </div>
      )}

      {/* API Error Display */}
      {error && !isFetching && (
        <Alert variant="destructive" className="shadow">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

       {/* Data Display Area */}
       {!isFetching && !error && (balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && (
          <div className="space-y-8">
             {/* Balance Info - Using Card */}
             {balance && (
               <div className="flex justify-end">
                 <Card className="w-fit shadow-sm border-l-4 border-blue-500">
                   <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                     <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
                     {/* Optional Icon */}
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold">
                       {balance.amount.toLocaleString(undefined, { style: 'currency', currency: balance.currency })}
                     </div>
                     <p className="text-xs text-muted-foreground mt-1">
                       As of {new Date(balance.balanceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                     </p>
                   </CardContent>
                 </Card>
               </div>
             )}

            {/* Transactions Tabs */}
             <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                   <TabsTrigger value="pending">Pending ({pendingTransactions.length})</TabsTrigger>
                   <TabsTrigger value="accounted">Accounted ({accountedTransactions.length})</TabsTrigger>
                </TabsList>
                {/* Use Card around Tab Content for better visual grouping */}
                <Card className="mt-4 shadow-sm">
                   <CardContent className="p-0"> {/* Reset padding, table handles it */}
                      <TabsContent value="pending" className="m-0">
                          <TransactionTable
                              transactions={pendingTransactions}
                              caption="Recent pending transactions."
                          />
                      </TabsContent>
                      <TabsContent value="accounted" className="m-0">
                          <TransactionTable
                              transactions={accountedTransactions}
                              caption="Posted account transactions."
                          />
                      </TabsContent>
                   </CardContent>
                </Card>
             </Tabs>
          </div>
       )}

       {/* Initial Prompt Message */}
       {!isFetching && !error && !(balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && (
           <Card className="mt-6 bg-secondary/50 border-l-4 border-secondary shadow-sm">
              <CardHeader>
                 <CardTitle className="text-base flex items-center">
                    <Info className="h-5 w-5 mr-2 text-muted-foreground"/>
                    Awaiting Input
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-muted-foreground">
                   Please fill in the required fields (Account ID, User Name, Region) and click "Fetch Details" to view account information.
                   Use 'error' or 'empty' in Account ID to test different states.
                 </p>
              </CardContent>
           </Card>
       )}
    </div>
  );
}
```
