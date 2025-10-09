import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

function TransactionCard({ transaction }) {
  const daysToCOE = transaction.close_of_escrow_date
    ? differenceInDays(parseISO(transaction.close_of_escrow_date), new Date())
    : null;

  return (
    <Link to={createPageUrl("TransactionDetail", `id=${transaction.id}`)} className="block w-48 flex-shrink-0">
      <div className="clay-element p-2 group overflow-hidden">
        <div className="h-24 rounded-xl overflow-hidden mb-2">
          <img
            src={transaction.property_image_url || `https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400`}
            alt={transaction.property_address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <p className="text-sm font-semibold truncate text-gray-800">{transaction.property_address}</p>
        <p className="text-xs text-gray-500">
          {daysToCOE !== null ? `${daysToCOE} days until COE` : 'COE TBD'}
        </p>
      </div>
    </Link>
  );
}

export default function ActiveTransactionsSlider() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .in('status', ["active_contingent", "active_noncontingent", "listed", "seller_in_possession"])
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error("Failed to fetch active transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }
  
  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4">
        {transactions.map(tx => (
          <TransactionCard key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  );
}