import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

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

interface TransactionsListProps {
  transactions: Transaction[];
  selectedAccount: string;
  onTransactionDeleted: () => void;
}

export const TransactionsList = ({ transactions, selectedAccount, onTransactionDeleted }: TransactionsListProps) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredTransactions = selectedAccount === 'all' 
    ? transactions 
    : transactions.filter(t => t.account_id === selectedAccount);

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setDeletingId(transactionId);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed successfully.",
      });

      onTransactionDeleted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (filteredTransactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No transactions found. Add your first transaction to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredTransactions.map(transaction => (
        <div 
          key={transaction.id} 
          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              transaction.type === 'income' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {transaction.type === 'income' ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownLeft className="h-4 w-4" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium truncate">
                  {transaction.description || 'No description'}
                </p>
                {transaction.categories && (
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: transaction.categories.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {transaction.categories.name}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {transaction.accounts.name} • {format(new Date(transaction.date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className={`font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
              </p>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(transaction.id)}
              disabled={deletingId === transaction.id}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};