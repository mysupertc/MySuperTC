import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { differenceInDays, parseISO } from 'date-fns';

const getStatusInfo = (status) => {
    switch (status) {
      case 'active_contingent': return { label: 'Contingent', color: 'bg-yellow-100 text-yellow-800' };
      case 'active_noncontingent': return { label: 'Non-Contingent', color: 'bg-blue-100 text-blue-800' };
      case 'pending': return { label: 'Pending', color: 'bg-indigo-100 text-indigo-800' };
      case 'closed': return { label: 'Closed', color: 'bg-gray-200 text-gray-800' };
      case 'cancelled': return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
      case 'seller_in_possession': return { label: 'Seller in Possession', color: 'bg-purple-100 text-purple-800' };
      case 'pre_listing': return { label: 'Pre-Listing', color: 'bg-green-100 text-green-800' };
      case 'listed': return { label: 'Listed', color: 'bg-green-100 text-green-800' };
      default: return { label: status.replace(/_/g, ' '), color: 'bg-gray-100 text-gray-800' };
    }
};

export default function TransactionCard({ transaction }) {
    const daysToCOE = transaction.close_of_escrow_date
        ? differenceInDays(parseISO(transaction.close_of_escrow_date), new Date())
        : null;

    const statusInfo = getStatusInfo(transaction.status);

    return (
        <Link to={createPageUrl("TransactionDetail", `id=${transaction.id}`)} className="group">
            <div className="w-64 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex-shrink-0">
                <div className="h-40 relative overflow-hidden">
                    <img 
                        src={transaction.property_image_url || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=800'} 
                        alt={transaction.property_address || 'Property'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                </div>
                <div className="p-4 h-24 flex flex-col justify-between">
                    {daysToCOE !== null && transaction.status !== 'closed' && transaction.status !== 'cancelled' ? (
                         <p className="text-xs font-semibold text-gray-500 uppercase leading-tight">
                           {daysToCOE >= 0 ? `${daysToCOE} DAYS` : `${Math.abs(daysToCOE)} DAYS PAST`} UNTIL COE
                         </p>
                    ) : (transaction.status === 'closed' || transaction.status === 'cancelled') ? (
                         <p className={`text-xs font-semibold uppercase leading-tight ${statusInfo.color.replace('bg-', 'text-').replace('100', '700')}`}>
                           {statusInfo.label}
                         </p>
                    ) : (
                        <p className="text-xs font-semibold text-gray-500 uppercase leading-tight">
                          NEW LISTING
                        </p>
                    )}
                    <div className="flex-1 flex flex-col justify-center">
                        <p className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                          {transaction.property_address || 'Address TBD'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {transaction.sales_price ? `$${transaction.sales_price.toLocaleString()}` : 'Price TBD'}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}