
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle, Plus, Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isPast, isToday, add, isWeekend } from 'date-fns';
import { TaskItem } from '@/api/entities'; // Updated import path for TaskItem

const DATE_FIELD_LABELS = {
  original_contract_date: 'Original Contract Date',
  offer_acceptance_date: 'Offer Acceptance Date', 
  emd_due_date: 'Earnest Money Deposit Due',
  investigation_contingency_date: 'Investigation Contingency Due',
  loan_contingency_date: 'Loan Contingency Due',
  appraisal_contingency_date: 'Appraisal Contingency Due',
  seller_disclosures_date: 'Seller Disclosures Due',
  disclosures_due_back_date: 'Disclosures Due Back',
  close_of_escrow_date: 'Close of Escrow',
  final_walkthrough_date: 'Final Walkthrough Due',
  possession_date: 'Date of Possession'
};

const DATE_DEFINITIONS = [
  { key: 'original_contract_date', label: 'Original Contract Date', base: null, isBusinessDays: false },
  { key: 'offer_acceptance_date', label: 'Offer Acceptance', base: null, isBusinessDays: false },
  { key: 'emd_due_date', label: 'Earnest Money Deposit Due', base: 'offer_acceptance_date', isBusinessDays: true },
  { key: 'seller_disclosures_date', label: 'Seller Disclosures Due', base: 'offer_acceptance_date' },
  { key: 'investigation_contingency_date', label: 'Investigation Contingency Due', base: 'offer_acceptance_date' },
  { key: 'appraisal_contingency_date', label: 'Appraisal Contingency Due', base: 'offer_acceptance_date' },
  { key: 'loan_contingency_date', label: 'Loan Contingency Due', base: 'offer_acceptance_date' },
  { key: 'disclosures_due_back_date', label: 'Disclosures Due Back', base: 'seller_disclosures_date' },
  { key: 'final_walkthrough_date', label: 'Final Walkthrough Due', base: 'close_of_escrow_date' },
  { key: 'close_of_escrow_date', label: 'Close of Escrow', base: 'offer_acceptance_date' },
  { key: 'possession_date', label: 'Date of Possession', base: 'close_of_escrow_date' },
];

export default function TransactionCalendarGrid({ transaction, taskItems, disclosureItems, onUpdate, transactionId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    task_name: '',
    due_date: '',
    section: 'agent_broker',
    notes: ''
  });

  // Get property address without city, state, zip for ICS files
  const getShortAddress = () => {
    if (!transaction || !transaction.property_address) return 'Property';
    return transaction.property_address.split(',')[0].trim();
  };

  // Extract all dates for this transaction including checklist items
  const transactionDates = useMemo(() => {
    if (!transaction) return []; // GUARD CLAUSE: Prevent error if transaction is not provided
    const dates = [];
    
    // Add important dates
    Object.keys(DATE_FIELD_LABELS).forEach(dateKey => {
      if (transaction[dateKey]) {
        let status = transaction[`${dateKey}_status`] || 'in_progress';
        const date = parseISO(transaction[dateKey]);
        
        if (dateKey === 'offer_acceptance_date') {
          status = 'completed';
        } else if (isPast(date) && status !== 'completed' && status !== 'waived') {
          status = 'overdue';
        }
        
        dates.push({
          id: `transaction-${dateKey}`,
          date: date,
          title: DATE_FIELD_LABELS[dateKey],
          status: status,
          notes: transaction[`${dateKey}_notes`] || '',
          type: 'transaction',
          category: 'Important Date'
        });
      }
    });
    
    return dates;
  }, [transaction]);

  // Extract task dates
  const taskDates = useMemo(() => {
    if (!taskItems) return [];
    
    return taskItems
      .filter(task => task.due_date)
      .map(task => {
        const date = parseISO(task.due_date);
        let status = 'pending';
        
        if (task.completed) {
          status = 'completed';
        } else if (isPast(date)) {
          status = 'overdue';
        }

        return {
          id: `task-${task.id}`,
          date: date,
          title: task.task_name,
          status: status,
          notes: task.notes || '',
          type: 'task',
          category: task.section === 'agent_broker' ? 'Agent Task' : 'Escrow Task'
        };
      });
  }, [taskItems]);

  // Extract disclosure items with dates
  const disclosureDates = useMemo(() => {
    if (!disclosureItems) return [];
    
    return disclosureItems
      .filter(item => item.due_date) // Assuming disclosure items can have due dates
      .map(item => {
        const date = parseISO(item.due_date);
        let status = 'pending';
        
        if ((item.seller_signed && item.buyer_signed) || 
            (item.seller_signed && item.no_seller_buyer) || 
            (item.buyer_signed && item.no_seller_buyer)) {
          status = 'completed';
        } else if (isPast(date)) {
          status = 'overdue';
        }

        return {
          id: `disclosure-${item.id}`,
          date: date,
          title: `${item.document_name} Due`,
          status: status,
          notes: item.notes || '',
          type: 'disclosure',
          category: 'Disclosure Item'
        };
      });
  }, [disclosureItems]);

  const allDates = [...transactionDates, ...taskDates, ...disclosureDates];

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getDatesForDay = (day) => {
    return allDates.filter(dateItem => isSameDay(dateItem.date, day));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'waived': return 'bg-gray-100 text-gray-700';
      case 'in_progress': 
      case 'pending': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Generate ICS file for individual date
  const generateICS = (dateItem) => {
    const dateStr = format(dateItem.date, 'yyyyMMdd');
    const shortAddress = getShortAddress();
    const title = `${dateItem.title} - ${shortAddress}`;

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Super TC//Transaction Calendar//EN\n';
    icsContent += `BEGIN:VEVENT\n`;
    icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
    icsContent += `SUMMARY:${title}\n`;
    icsContent += `DESCRIPTION:${dateItem.notes || dateItem.title}\n`;
    icsContent += `BEGIN:VALARM\n`;
    icsContent += `TRIGGER:-P1D\n`;
    icsContent += `ACTION:DISPLAY\n`;
    icsContent += `DESCRIPTION:Reminder: ${title}\n`;
    icsContent += `END:VALARM\n`;
    icsContent += `END:VEVENT\n`;
    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    setShowDayDetails(true);
  };

  const handleAddNewTask = async () => {
    if (!newTaskData.task_name || !selectedDay) return;
    
    const taskData = {
      ...newTaskData,
      transaction_id: transactionId,
      due_date: format(selectedDay, 'yyyy-MM-dd')
    };
    
    await TaskItem.create(taskData);
    setNewTaskData({ task_name: '', due_date: '', section: 'agent_broker', notes: '' });
    setShowAddForm(false);
    onUpdate(); // Refresh data
  };

  const calendarDays = getCalendarDays();
  const monthStart = startOfMonth(currentDate);

  return (
    <>
      <Card className="clay-element border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-3">
              <Calendar className="w-5 h-5 text-purple-600" />
              Transaction Calendar
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="clay-element border-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-2 font-semibold text-gray-700">
                {format(currentDate, 'MMMM yyyy')}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="clay-element border-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 text-sm">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const dayDates = getDatesForDay(day);
              const isCurrentMonth = day.getMonth() === monthStart.getMonth();
              const isDayToday = isToday(day);
              const isHovered = hoveredDay && isSameDay(hoveredDay, day);
              
              return (
                <div 
                  key={day.toISOString()}
                  className={`min-h-20 p-1 clay-element cursor-pointer hover:shadow-lg transition-all relative ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isDayToday ? 'ring-2 ring-blue-400' : ''}`}
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isDayToday ? 'text-blue-700 font-bold' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayDates.slice(0, 2).map(dateItem => (
                      <Badge 
                        key={dateItem.id}
                        className={`text-xs p-1 block truncate border-0 ${getStatusColor(dateItem.status)}`}
                        title={dateItem.title}
                      >
                        {dateItem.type === 'task' ? '📋' : dateItem.type === 'disclosure' ? '📄' : '🏠'} {dateItem.title.split(' ')[0]}
                      </Badge>
                    ))}
                    
                    {dayDates.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayDates.length - 2}
                      </div>
                    )}
                  </div>

                  {/* Hover tooltip */}
                  {isHovered && dayDates.length > 0 && (
                    <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 bottom-full left-0 mb-2 min-w-64">
                      <div className="font-semibold text-sm mb-2">
                        {format(day, 'MMM d, yyyy')}
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {dayDates.map(dateItem => (
                          <div key={dateItem.id} className="flex items-center justify-between text-xs">
                            <span className="truncate mr-2">{dateItem.title}</span>
                            <Badge className={`${getStatusColor(dateItem.status)} border-0 text-xs`}>
                              {dateItem.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Day Details Sheet */}
      <Sheet open={showDayDetails} onOpenChange={setShowDayDetails}>
        <SheetContent className="clay-element border-0 w-full max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-2xl">
              {selectedDay && format(selectedDay, 'MMMM d, yyyy')}
            </SheetTitle>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {/* Events for this day */}
            <div>
              <h4 className="font-semibold text-lg mb-3">Events & Deadlines</h4>
              <div className="space-y-3">
                {selectedDay && getDatesForDay(selectedDay).map(dateItem => (
                  <div key={dateItem.id} className="clay-element p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{dateItem.title}</h5>
                      <div className="flex gap-2">
                        <Badge className={`${getStatusColor(dateItem.status)} border-0`}>
                          {dateItem.status.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateICS(dateItem)}
                          className="clay-element border-0 p-1 h-6 w-6"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{dateItem.category}</p>
                    {dateItem.notes && (
                      <p className="text-sm text-gray-500 mt-2">{dateItem.notes}</p>
                    )}
                  </div>
                ))}
                
                {selectedDay && getDatesForDay(selectedDay).length === 0 && (
                  <p className="text-gray-500 text-sm">No events scheduled for this day</p>
                )}
              </div>
            </div>

            {/* Add new task/reminder - Conditionally render based on transactionId */}
            {transactionId && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-lg">Add Reminder</h4>
                  <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    size="sm"
                    className="clay-element clay-accent-mint border-0"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                
                {showAddForm && (
                  <div className="clay-element p-4 rounded-lg space-y-3">
                    <div>
                      <Label className="text-sm">Task Name</Label>
                      <Input
                        value={newTaskData.task_name}
                        onChange={(e) => setNewTaskData(prev => ({...prev, task_name: e.target.value}))}
                        className="clay-element border-0 mt-1"
                        placeholder="Enter task description..."
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm">Section</Label>
                      <Select 
                        value={newTaskData.section} 
                        onValueChange={(value) => setNewTaskData(prev => ({...prev, section: value}))}
                      >
                        <SelectTrigger className="clay-element border-0 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="clay-element border-0">
                          <SelectItem value="agent_broker">Agent/Broker Tasks</SelectItem>
                          <SelectItem value="escrow_title">Escrow & Title Tasks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm">Notes</Label>
                      <Textarea
                        value={newTaskData.notes}
                        onChange={(e) => setNewTaskData(prev => ({...prev, notes: e.target.value}))}
                        className="clay-element border-0 mt-1"
                        placeholder="Add any additional notes..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleAddNewTask} className="clay-element clay-accent-mint border-0">
                        Add Task
                      </Button>
                      <Button variant="ghost" onClick={() => setShowAddForm(false)} className="clay-element border-0">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
