import React from 'react';
import TransactionCard from './TransactionCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const getStatusColorClass = (statusKey) => {
  switch (statusKey) {
    case 'active_contingent': return 'bg-yellow-500';
    case 'active_noncontingent': return 'bg-blue-500';
    case 'seller_in_possession': return 'bg-purple-500';
    case 'closed': return 'bg-gray-500';
    case 'cancelled': return 'bg-red-500';
    case 'pre_listing': return 'bg-green-500';
    case 'listed': return 'bg-emerald-500';
    default: return 'bg-gray-500';
  }
};

export default function TransactionGroup({ title, transactions, statusKey, showTitle = true }) {
    const scrollContainerRef = React.useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    
    if (transactions.length === 0) return null;

    return (
        <div className="space-y-6">
            {showTitle && (
                <div className="flex items-center gap-4">
                    <div className={`h-3 w-12 rounded-full ${getStatusColorClass(statusKey)}`}></div>
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>
            )}
            <div className="relative">
                 <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 rounded-full h-10 w-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hidden md:flex"
                    onClick={() => scroll('left')}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div 
                    ref={scrollContainerRef} 
                    className="flex gap-4 overflow-x-auto pb-2 scroll-smooth hide-scrollbar" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {transactions.map(transaction => (
                        <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                </div>
                 <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 rounded-full h-10 w-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg hidden md:flex"
                    onClick={() => scroll('right')}
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}