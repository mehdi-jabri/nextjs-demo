// app/account-details-shadcn/page.tsx
'use client';

import React, { useState, useCallback, FormEvent } from 'react';

// Import shadcn/ui components (keep these)
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Remove shadcn/ui useToast import
// import { useToast } from '@/components/ui/use-toast';

// Import Sonner's toast function
import { toast } from 'sonner';

// Import Icons (keep these)
import { Loader2, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import the dynamic TransactionTable and its types
import TransactionTable, { HeaderDefinition } from './TransactionTable'; // Adjust path if needed

// --- Interfaces (remain the same) ---
interface Balance { /* ... */ }
interface Transaction { /* ... */ }

// --- Mock API Functions (remain the same) ---
const fetchBalance = async (accountId: string): Promise<Balance> => { /* ... */ };
const fetchTransactions = async (accountId: string, type: 'pending' | 'accounted'): Promise<Transaction[]> => { /* ... */ };

// --- Main Page Component ---
export default function AccountDetailsShadcnPage() {
// Form state
const [accountId, setAccountId] = useState('');
const [userName, setUserName] = useState('');
const [region, setRegion] = useState('');

const [isFetching, setIsFetching] = useState(false); // Still useful for disabling button etc.
const [error, setError] = useState<string | null>(null); // Keep for displaying inline Alert
const [formError, setFormError] = useState<string | null>(null);

// Data state
const [balance, setBalance] = useState<Balance | null>(null);
const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
const [accountedTransactions, setAccountedTransactions] = useState<Transaction[]>([]);

// Remove useToast initialization
// const { toast } = useToast();

const handleInputChange = () => {
setBalance(null);
setPendingTransactions([]);
setAccountedTransactions([]);
setError(null);
setFormError(null);
};

// Updated fetch data function using Sonner
const fetchDataForAccount = useCallback(async (id: string) => {
setIsFetching(true); // Set loading state for UI elements
setError(null);
setBalance(null);
setPendingTransactions([]);
setAccountedTransactions([]);

    // Use toast.promise for cleaner async handling with Sonner
    const promise = Promise.all([
        fetchBalance(id),
        fetchTransactions(id, 'pending'),
        fetchTransactions(id, 'accounted'),
      ]);

    toast.promise(promise, {
      loading: `Workspaceing data for Account ID: ${id}...`,
      success: (data) => {
        // Data here is an array: [balanceData, pendingData, accountedData]
        const [balanceData, pendingData, accountedData] = data;
        setBalance(balanceData);
        setPendingTransactions(pendingData);
        setAccountedTransactions(accountedData);
        setIsFetching(false); // Reset fetching state on success
        // Return the success message for the toast
        return `Data fetched successfully for Account ID: ${id}!`;
      },
      error: (err: any) => {
        const errorMessage = err?.message || 'An unknown error occurred during fetching.';
        setError(errorMessage); // Update inline error state as well
        setIsFetching(false); // Reset fetching state on error
        // Return the error message for the toast
        return `Error fetching data: ${errorMessage}`;
      },
    });

}, []); // No dependencies needed for toast function itself

// Form submission handler
const handleSubmit = (event: FormEvent) => {
event.preventDefault();
setFormError(null);

    if (!accountId.trim()) { setFormError('Account ID cannot be empty.'); return; }
    if (!userName.trim()) { setFormError('User Name cannot be empty.'); return; }
    if (!region) { setFormError('Please select a Region.'); return; }

    console.log('Form submitted with:', { accountId, userName, region });
    // Let fetchDataForAccount handle the loading state and toasts via toast.promise
    fetchDataForAccount(accountId);
};

// --- Define Header Configurations (remains the same) ---
const transactionHeaders: HeaderDefinition<Transaction>[] = [
{ key: 'date', label: 'Date', isDate: true, headerClassName: "w-[120px]" },
{ key: 'description', label: 'Description', cellClassName: "truncate max-w-[300px]" },
{
key: 'amount', label: 'Amount ($)', isNumeric: true, headerClassName: "w-[150px]",
formatFn: (value, item) => ( <span className={cn('font-semibold', item.sign === 'Credit' ? 'text-green-600' : 'text-red-600')}> {item.sign === 'Credit' ? '+' : '-'} {Number(value).toFixed(2)} {item.currency ? ` ${item.currency}` : ''} </span> ),
},
];

return (
// Container and Form Section remain largely the same...
<div className="container mx-auto max-w-5xl py-10 px-4 space-y-8">
<Card className="shadow-md">
<CardHeader>
<CardTitle className="text-xl font-semibold">Account Details Filter</CardTitle>
<CardDescription>Enter details below to fetch account information.</CardDescription>
</CardHeader>
<CardContent>
{/* Form structure remains the same */}
<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
{/* Account ID Input */}
<div className="space-y-2">
<Label htmlFor="accountId">Account ID <span className="text-red-500">*</span></Label>
<Input id="accountId" placeholder="e.g., 12345, 'error', 'empty'" value={accountId} onChange={(e) => { setAccountId(e.target.value); handleInputChange(); }} />
</div>
{/* User Name Input */}
<div className="space-y-2">
<Label htmlFor="userName">User Name <span className="text-red-500">*</span></Label>
<Input id="userName" placeholder="e.g., John Doe" value={userName} onChange={(e) => { setUserName(e.target.value); handleInputChange(); }} />
</div>
{/* Region Select */}
<div className="space-y-2">
<Label htmlFor="region">Region <span className="text-red-500">*</span></Label>
<Select value={region} onValueChange={(value) => { setRegion(value); handleInputChange(); }}>
<SelectTrigger id="region"><SelectValue placeholder="Select region..." /></SelectTrigger>
<SelectContent>
<SelectItem value="amer">AMER</SelectItem>
<SelectItem value="apac">APAC</SelectItem>
<SelectItem value="emea">EMEA</SelectItem>
</SelectContent>
</Select>
</div>
{/* Form Error and Submit Button */}
<div className="md:col-span-3 space-y-4">
{formError && ( <Alert variant="destructive" className="text-sm"><AlertCircle className="h-4 w-4" /><AlertTitle>Validation Error</AlertTitle><AlertDescription>{formError}</AlertDescription></Alert> )}
<Button type="submit" disabled={isFetching}>
{isFetching ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Fetching...</> ) : ( 'Fetch Details' )}
</Button>
</div>
</form>
</CardContent>
</Card>

      {/* Loading State - Keep UI feedback, but toast handles primary notification */}
      {isFetching && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/50 rounded-lg shadow-inner border border-dashed">
           <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
           <p className="text-lg font-medium text-muted-foreground">Loading account data...</p>
        </div>
      )}

      {/* API Error Display - Keep inline Alert as well, for persistent errors */}
      {error && !isFetching && (
        <Alert variant="destructive" className="shadow">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Error Occurred</AlertTitle>
          <AlertDescription>{error} - Please check the Account ID or try again later.</AlertDescription>
        </Alert>
      )}

       {/* Data Display Area (remains the same) */}
       {!isFetching && !error && (balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && (
          <div className="space-y-8">
            {/* Balance Info Card */}
            {balance && ( <div className="flex justify-end"> <Card className="w-fit shadow-sm border-l-4 border-blue-500"> {/* ... Balance content ... */} </Card> </div> )}
            {/* Transactions Tabs */}
             <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-2"> {/* ... TabsTriggers ... */} </TabsList>
                <Card className="mt-4 shadow-sm">
                   <CardContent className="p-0">
                      <TabsContent value="pending" className="m-0"> <TransactionTable transactions={pendingTransactions} headers={transactionHeaders} caption="Recent pending transactions." /> </TabsContent>
                      <TabsContent value="accounted" className="m-0"> <TransactionTable transactions={accountedTransactions} headers={transactionHeaders} caption="Posted account transactions." /> </TabsContent>
                   </CardContent>
                </Card>
             </Tabs>
          </div>
       )}

       {/* Initial Prompt Message (remains the same) */}
       {!isFetching && !error && !(balance || pendingTransactions.length > 0 || accountedTransactions.length > 0) && ( <Card className="mt-6 bg-secondary/50 border-l-4 border-secondary shadow-sm"> {/* ... Prompt content ... */} </Card> )}
    </div>
);
}
