import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Account {
  id: string;
  name: string;
  description: string;
  current_balance: number;
  currency: string;
}

interface AccountsManagerProps {
  accounts: Account[];
  onAccountsChanged: () => void;
}

export const AccountsManager = ({ accounts, onAccountsChanged }: AccountsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  
  const [newAccount, setNewAccount] = useState({
    name: '',
    description: '',
    initialBalance: '',
    currency: 'USD',
  });

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name: newAccount.name,
          description: newAccount.description,
          currency: newAccount.currency,
          initial_balance: parseFloat(newAccount.initialBalance) || 0,
          current_balance: parseFloat(newAccount.initialBalance) || 0,
        });

      if (error) throw error;

      toast({
        title: "Account created",
        description: `${newAccount.name} has been added successfully.`,
      });

      setNewAccount({
        name: '',
        description: '',
        initialBalance: '',
        currency: 'USD',
      });
      setIsAddingAccount(false);
      onAccountsChanged();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`Are you sure you want to delete "${accountName}"? This will also delete all associated transactions.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      toast({
        title: "Account deleted",
        description: `${accountName} has been removed.`,
      });

      onAccountsChanged();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Accounts</h2>
          <p className="text-muted-foreground">Manage your financial accounts</p>
        </div>
        <Dialog open={isAddingAccount} onOpenChange={setIsAddingAccount}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new account to track your finances separately.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input
                  id="name"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Checking Account, Savings, Cash"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={newAccount.description}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this account"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialBalance">Initial Balance</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  value={newAccount.initialBalance}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, initialBalance: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingAccount(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No Accounts Yet</CardTitle>
            <CardDescription>
              Create your first account to start tracking your finances
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    {account.description && (
                      <CardDescription>{account.description}</CardDescription>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAccount(account.id, account.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatAmount(account.current_balance)}
                </div>
                <p className="text-sm text-muted-foreground">{account.currency}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};