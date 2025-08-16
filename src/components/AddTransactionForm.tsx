import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Account {
  id: string;
  name: string;
  description: string;
  current_balance: number;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  transaction_type: 'income' | 'expense';
}

interface AddTransactionFormProps {
  accounts: Account[];
  onTransactionAdded: () => void;
  selectedAccountId?: string;
}

export const AddTransactionForm = ({ accounts, onTransactionAdded, selectedAccountId }: AddTransactionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  
  const [formData, setFormData] = useState({
    accountId: selectedAccountId || '',
    categoryId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchCategories();
  }, [type]);

  useEffect(() => {
    if (selectedAccountId) {
      setFormData(prev => ({ ...prev, accountId: selectedAccountId }));
    }
  }, [selectedAccountId]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('transaction_type', type);
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: formData.accountId,
          category_id: formData.categoryId || null,
          type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
        });

      if (error) throw error;

      toast({
        title: "Transaction added",
        description: `${type === 'income' ? 'Income' : 'Expense'} of $${formData.amount} has been recorded.`,
      });

      // Reset form
      setFormData({
        accountId: selectedAccountId || '',
        categoryId: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });

      onTransactionAdded();
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

  if (accounts.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground mb-4">
          You need to create an account first before adding transactions.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={type} onValueChange={(value) => setType(value as 'income' | 'expense')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expense" className="text-red-600">Expense</TabsTrigger>
          <TabsTrigger value="income" className="text-green-600">Income</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor="account">Account</Label>
        <Select 
          value={formData.accountId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.name} (${account.current_balance.toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category (optional)</Label>
        <Select 
          value={formData.categoryId} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What was this for?"
          rows={2}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Adding...' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
      </Button>
    </form>
  );
};