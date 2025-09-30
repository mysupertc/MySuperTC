import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, CheckCircle, AlertCircle, Plus, Filter } from 'lucide-react';
import { format, parseISO, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns';

const DATE_FIELD_LABELS = {
  original_contract_date: 'Original Contract Date',
  offer_acceptance_date: 'Offer Acceptance Date', 
  emd_due_date: 'Earnest Money Deposit Due',
  investigation_contingency_date: 'Investigation Contingency',
  loan_contingency_date: 'Loan Contingency',
  appraisal_contingency_date: 'Appraisal Contingency',
  seller_disclosures_date: 'Seller Disclosures',
  disclosures_due_back_date: 'Disclosures Due Back',
  close_of_escrow_date: 'Close of Escrow',
  final_walkthrough_date: 'Final Walkthrough',
  possession_date: 'Date of Possession'
};

export default function TransactionTimeline({ transaction, taskItems, onUpdate }) {
  const [showFilter, setShowFilter] = useState('upcoming'); // 'all', 'upcoming', 'overdue'

  // Combine all important dates and tasks into a single timeline
  const timelineItems = useMemo(() => {
    const items = [];

    // Add transaction important dates
    Object.keys(DATE_FIELD_LABELS).forEach(dateKey => {
      if (transaction[dateKey]) {
        const date = parseISO(transaction[dateKey]);
        const status = transaction[`${dateKey}_status`] || 'in_progress';
        const notes = transaction[`${dateKey}_notes`] || '';
        
        let finalStatus = status;
        if (dateKey === 'offer_acceptance_date') {
          finalStatus = 'completed';
        } else if (isPast(date) && status !== 'completed' && status !== 'waived') {
          finalStatus = 'overdue';
        }

        items.push({
          id: `transaction-${dateKey}`,
          date: date,
          title: DATE_FIELD_LABELS[dateKey],
          status: finalStatus,
          notes: notes,
          type: 'transaction',
          category: 'Important Date'
        });
      }
    });

    // Add task items
    if (taskItems) {
      taskItems.forEach(task => {
        if (task.due_date) {
          const date = parseISO(task.due_date);
          let status = 'pending';
          
          if (task.completed) {
            status = 'completed';
          } else if (isPast(date)) {
            status = 'overdue';
          }

          items.push({
            id: `task-${task.id}`,
            date: date,
            title: task.task_name,
            status: status,
            notes: task.notes || '',
            type: 'task',
            category: task.section === 'agent_broker' ? 'Agent Task' : 'Escrow Task'
          });
        }
      });
    }

    // Sort by date
    items.sort((a, b) => a.date - b.date);
    return items;
  }, [transaction, taskItems]);

  // Filter items based on selected filter
  const filteredItems = useMemo(() => {
    const now = new Date();
    
    switch (showFilter) {
      case 'upcoming':
        return timelineItems.filter(item => 
          item.date >= now && item.status !== 'completed' && item.status !== 'waived'
        );
      case 'overdue':
        return timelineItems.filter(item => item.status === 'overdue');
      case 'all':
      default:
        return timelineItems;
    }
  }, [timelineItems, showFilter]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      case 'waived':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
      case 'pending':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getDateContext = (date) => {
    const daysAway = differenceInDays(date, new Date());
    
    if (isToday(date)) return { text: 'Today', color: 'text-red-600 font-semibold' };
    if (isTomorrow(date)) return { text: 'Tomorrow', color: 'text-orange-600 font-semibold' };
    if (daysAway > 0 && daysAway <= 7) return { text: `${daysAway} days`, color: 'text-yellow-600 font-medium' };
    if (daysAway < 0) return { text: `${Math.abs(daysAway)} days overdue`, color: 'text-red-600 font-semibold' };
    return { text: format(date, 'MMM d'), color: 'text-gray-600' };
  };

  const upcomingCount = timelineItems.filter(item => 
    item.date >= new Date() && item.status !== 'completed' && item.status !== 'waived'
  ).length;
  
  const overdueCount = timelineItems.filter(item => item.status === 'overdue').length;

  return (
    <Card className="clay-element border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-3">
          <Calendar className="w-5 h-5 text-purple-600" />
          Timeline
        </CardTitle>
        {/* Responsive filter buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Button
            variant={showFilter === 'upcoming' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowFilter('upcoming')}
            className="text-xs px-3 py-1 h-auto flex-shrink-0"
          >
            Upcoming ({upcomingCount})
          </Button>
          <Button
            variant={showFilter === 'overdue' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowFilter('overdue')}
            className="text-xs px-3 py-1 h-auto flex-shrink-0"
          >
            Overdue ({overdueCount})
          </Button>
          <Button
            variant={showFilter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowFilter('all')}
            className="text-xs px-3 py-1 h-auto flex-shrink-0"
          >
            All ({timelineItems.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No {showFilter} items</p>
            <p className="text-sm text-gray-400">
              {showFilter === 'upcoming' ? 'All important dates are either completed or in the past' :
               showFilter === 'overdue' ? 'No overdue items - great job staying on track!' :
               'No timeline items available for this transaction'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredItems.map((item, index) => {
              const dateContext = getDateContext(item.date);
              const isLast = index === filteredItems.length - 1;
              
              return (
                <div key={item.id} className="relative">
                  {/* Timeline line */}
                  {!isLast && (
                    <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200"></div>
                  )}
                  
                  <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    {/* Status icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                      {getStatusIcon(item.status)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm truncate">
                            {item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(item.status)} border-0`}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        
                        {/* Date info */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-xs ${dateContext.color}`}>
                            {dateContext.text}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {format(item.date, 'MMM d')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}