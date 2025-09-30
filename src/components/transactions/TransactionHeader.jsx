import React, { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Edit, MoreVertical, FileText, Share2, DollarSign, CalendarDays, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import ImportantDates from './ImportantDates';

const statusOptions = ["active_contingent", "active_noncontingent", "closed", "seller_in_possession", "cancelled", "pre_listing", "listed", "prospecting"];

const StatCard = ({ icon: Icon, label, value, color, onClick, clickable = false }) => (
  <div 
    className={`clay-element p-4 flex-1 ${clickable ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''}`}
    onClick={onClick}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${color}`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-sm text-gray-500">{label}</p>
    <div className="text-lg font-bold text-gray-800">{value}</div>
  </div>
);

export default function TransactionHeader({ 
  transaction, 
  onUpdate, 
  pendingDisclosures, 
  pendingTasks, 
  onSalesPriceClick,
  onScrollToTransactionDetails 
}) {
  const [showCOEEditor, setShowCOEEditor] = useState(false);
  
  const daysToCOE = transaction.close_of_escrow_date
    ? differenceInDays(parseISO(transaction.close_of_escrow_date), new Date())
    : null;

  const handleStatusChange = (newStatus) => {
    onUpdate({ status: newStatus });
  };
  
  const statusLabel = (status) => status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const handleSalesPriceClick = () => {
    if (onScrollToTransactionDetails) {
      onScrollToTransactionDetails();
    }
  };

  const handleCOEClick = () => {
    setShowCOEEditor(true);
  };

  return (
    <>
      <div className="clay-element p-6 rounded-3xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("Transactions")}>
              <Button variant="outline" size="icon" className="clay-element border-0 w-12 h-12">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{transaction.property_address}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="clay-element border-0">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/3 h-48 rounded-2xl overflow-hidden clay-element">
            <img 
              src={transaction.property_image_url || `https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800`}
              alt="Property"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2 lg:col-span-4 clay-element p-4 flex items-center justify-between">
              <p className="text-lg font-semibold text-gray-800">Status</p>
              <Select value={transaction.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[220px] clay-element border-0 font-semibold">
                  <SelectValue>{statusLabel(transaction.status)}</SelectValue>
                </SelectTrigger>
                <SelectContent className="clay-element border-0">
                  {statusOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{statusLabel(opt)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <StatCard 
              icon={DollarSign} 
              label="Sale Price" 
              value={
                <div>
                  <p>$ {transaction.sales_price?.toLocaleString() || 'N/A'}</p>
                  <p className="text-xs font-normal text-gray-500">EMD: ${transaction.emd_amount?.toLocaleString() || 'N/A'}</p>
                </div>
              }
              color="bg-green-400"
              clickable={true}
              onClick={handleSalesPriceClick}
            />
            
            <StatCard 
              icon={CalendarDays} 
              label="Days to COE" 
              value={daysToCOE !== null ? `${daysToCOE} days` : 'N/A'} 
              color="bg-blue-400"
              clickable={true}
              onClick={handleCOEClick}
            />
            
            <a href="#disclosures-checklist" className="contents">
              <StatCard icon={ClipboardList} label="Pending Disclosures" value={pendingDisclosures} color="bg-yellow-400" />
            </a>
            
            <a href="#tasks-checklist" className="contents">
              <StatCard icon={ClipboardList} label="Pending Tasks" value={pendingTasks} color="bg-purple-400" />
            </a>
          </div>
        </div>
      </div>

      {/* COE Editor Sheet - Made Scrollable */}
      <Sheet open={showCOEEditor} onOpenChange={setShowCOEEditor}>
        <SheetContent className="clay-element border-0 w-full max-w-lg overflow-hidden flex flex-col">
          <SheetHeader className="flex-shrink-0">
            <SheetTitle className="text-2xl">Edit Important Dates</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <ImportantDates 
              transaction={transaction} 
              onUpdate={onUpdate}
              transactionId={transaction.id}
              focusDateKey="close_of_escrow_date"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}