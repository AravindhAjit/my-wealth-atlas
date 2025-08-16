import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, LogOut, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { AddTransactionForm } from './AddTransactionForm';
import { AccountsManager } from './AccountsManager';
import { TransactionsList } from './TransactionsList';

interface Account {
  id: string;
  name: string;
  description: string;
  current_balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: string;
  account_id: string;
  accounts: { name: string };
  categories: { name: string; color: string } | null;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: true });

      // Fetch transactions with account and category info
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          accounts (name),
          categories (name, color)
        `)
        .order('date', { ascending: false })
        .limit(50);

      setAccounts(accountsData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const filteredTransactions = selectedAccount === 'all' 
      ? transactions 
      : transactions.filter(t => t.account_id === selectedAccount);

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalBalance = selectedAccount === 'all'
      ? accounts.reduce((sum, acc) => sum + Number(acc.current_balance), 0)
      : accounts.find(acc => acc.id === selectedAccount)?.current_balance || 0;

    return { totalIncome, totalExpenses, totalBalance };
  };

  const { totalIncome, totalExpenses, totalBalance } = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">MoneyTracker</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Account Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedAccount === 'all' ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setSelectedAccount('all')}
            >
              All Accounts
            </Badge>
            {accounts.map(account => (
              <Badge 
                key={account.id}
                variant={selectedAccount === account.id ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedAccount(account.id)}
              >
                {account.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {selectedAccount === 'all' ? 'All accounts' : accounts.find(a => a.id === selectedAccount)?.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5" />
                      Add Transaction
                    </CardTitle>
                    <CardDescription>
                      Quickly add income or expenses
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AddTransactionForm 
                      accounts={accounts} 
                      onTransactionAdded={fetchData}
                      selectedAccountId={selectedAccount === 'all' ? undefined : selectedAccount}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      Your latest financial activity
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionsList 
                      transactions={transactions}
                      selectedAccount={selectedAccount}
                      onTransactionDeleted={fetchData}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accounts">
            <AccountsManager accounts={accounts} onAccountsChanged={fetchData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};