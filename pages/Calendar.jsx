
import React, { useState, useEffect, useCallback } from "react";
import { Transaction, TaskItem, DisclosureItem } from "@/api/entities"; // Added DisclosureItem import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  Clock,
  ArrowLeft,
  Edit,
  Plus, // Added Plus icon
  X // Added X icon
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, parseISO, isPast } from "date-fns";

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

export default function Calendar() {
  const [transactions, setTransactions] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [taskDates, setTaskDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayViewDate, setDayViewDate] = useState(null);
  const [editingDateItem, setEditingDateItem] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null); // New state for hover tooltip
  const [dayViewData, setDayViewData] = useState({ dates: [], tasks: [] }); // New state to structure day view data
  const [showAddReminder, setShowAddReminder] = useState(false); // New state for Add Reminder sheet
  const [newReminder, setNewReminder] = useState({ // New state for new reminder form
    task_name: '',
    due_date: '',
    notes: '',
    transaction_id: ''
  });

  const extractImportantDates = useCallback((transactionData) => {
    const dates = [];
    
    transactionData.forEach(transaction => {
      Object.keys(DATE_FIELD_LABELS).forEach(dateKey => {
        if (transaction[dateKey]) {
          dates.push({
            id: `${transaction.id}-${dateKey}`,
            date: parseISO(transaction[dateKey]),
            label: DATE_FIELD_LABELS[dateKey],
            transaction: transaction,
            dateKey: dateKey,
            status: transaction[`${dateKey}_status`] || 'in_progress',
            notes: transaction[`${dateKey}_notes`] || '',
            type: 'transaction'
          });
        }
      });
    });
    
    dates.sort((a, b) => a.date - b.date);
    setSelectedDates(dates);
  }, []);

  const extractTaskDates = useCallback(async () => {
    try {
      const allTasks = await TaskItem.list();
      
      const taskDatesArray = allTasks
        .filter(task => task.due_date) // Show all tasks with due dates, not just incomplete ones
        .map(task => ({
          id: `task-${task.id}`,
          date: parseISO(task.due_date),
          label: task.task_name,
          task: task,
          // Determine status based on completion and past due
          status: task.completed ? 'completed' : (isPast(parseISO(task.due_date)) ? 'overdue' : 'pending'),
          notes: task.notes || '',
          type: 'task',
          completed: task.completed // Add completed flag
        }));
      
      setTaskDates(taskDatesArray);
    } catch (error) {
      console.error('Error loading task dates:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await Transaction.list();
        setTransactions(data);
        extractImportantDates(data);
        await extractTaskDates();
      } catch (error) {
        console.error('Error loading transactions or tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [extractImportantDates, extractTaskDates]);

  const getCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const getDatesForDay = (day) => {
    const transactionDates = selectedDates.filter(dateItem => isSameDay(dateItem.date, day));
    const taskDatesForDay = taskDates.filter(taskDate => isSameDay(taskDate.date, day));
    return { transactionDates, taskDates: taskDatesForDay }; // Return object
  };

  const handleDayClick = (day) => {
    const { transactionDates, taskDates: dayTasks } = getDatesForDay(day);
    if (transactionDates.length > 0 || dayTasks.length > 0) {
      setDayViewData({ dates: transactionDates, tasks: dayTasks }); // Set structured day data
      setDayViewDate(day);
      setNewReminder(prev => ({ ...prev, due_date: format(day, 'yyyy-MM-dd') })); // Pre-fill date for new reminder
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.task_name || !newReminder.due_date) {
      alert("Task Name and Due Date are required.");
      return;
    }
    
    try {
      // Get the first transaction if available for context if none selected
      const defaultTransactionId = transactions.length > 0 ? transactions[0].id : null;
      
      const reminderData = {
        ...newReminder,
        transaction_id: newReminder.transaction_id || defaultTransactionId,
        section: 'agent_broker' // Default section for tasks created here
      };
      
      await TaskItem.create(reminderData);
      
      // Refresh data
      await extractTaskDates();
      // If we are in day view for the added date, update dayViewData
      if (dayViewDate && isSameDay(parseISO(newReminder.due_date), dayViewDate)) {
        const { transactionDates, taskDates: updatedDayTasks } = getDatesForDay(dayViewDate);
        setDayViewData({ dates: transactionDates, tasks: updatedDayTasks });
      }
      setNewReminder({ task_name: '', due_date: '', notes: '', transaction_id: '' }); // Reset form
      setShowAddReminder(false);
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to add reminder. Please try again.');
    }
  };

  const handleUpdateDateItem = async (dateItem, updates) => {
    if (dateItem.type === 'transaction') {
      const updateData = {
        [dateItem.dateKey]: updates.date,
        [`${dateItem.dateKey}_status`]: updates.status,
        [`${dateItem.dateKey}_notes`]: updates.notes
      };
      
      await Transaction.update(dateItem.transaction.id, updateData);
    } else if (dateItem.type === 'task') {
      // Logic to update task item
      const updateData = {
        due_date: updates.date,
        notes: updates.notes,
        completed: updates.status === 'completed' // Assuming 'completed' status means task is completed
      };
      await TaskItem.update(dateItem.task.id, updateData);
    }
    
    // Refresh data
    const transactionData = await Transaction.list();
    setTransactions(transactionData);
    extractImportantDates(transactionData);
    await extractTaskDates(); // Re-fetch tasks after update
    // Update dayViewData if currently in day view
    if (dayViewDate && isSameDay(parseISO(updates.date), dayViewDate)) {
      const { transactionDates, taskDates: updatedDayTasks } = getDatesForDay(dayViewDate);
      setDayViewData({ dates: transactionDates, tasks: updatedDayTasks });
    }
    setEditingDateItem(null);
  };

  const getDateTypeColor = (status, isCompleted = false) => {
    if (isCompleted) return 'bg-gray-100 text-gray-500 opacity-60'; // Greyed out for completed tasks
    switch (status) {
      case 'completed': return 'clay-accent-mint text-green-700';
      case 'in_progress': return 'clay-accent-blue text-blue-700';
      case 'overdue': return 'bg-red-100 text-red-700 badge-glow-red'; // Generic overdue for non-task items
      case 'waived': return 'bg-gray-100 text-gray-700';
      case 'negotiating': return 'bg-orange-100 text-orange-700';
      case 'extended': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-blue-100 text-blue-700'; // For pending tasks
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const exportToCalendar = () => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Super TC//Calendar//EN\n';
    
    // Export transaction dates
    selectedDates.forEach(dateItem => {
      const dateStr = format(dateItem.date, 'yyyyMMdd');
      const propertyAddress = dateItem.transaction.property_address?.split(',')[0] || 'Property';
      const title = `${dateItem.label} Due - ${propertyAddress}`;
      
      icsContent += `BEGIN:VEVENT\n`;
      icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
      icsContent += `SUMMARY:${title}\n`;
      icsContent += `DESCRIPTION:${dateItem.notes || dateItem.label}\n`;
      // Add reminder 1 day before
      icsContent += `BEGIN:VALARM\n`;
      icsContent += `TRIGGER:-P1D\n`;
      icsContent += `ACTION:EMAIL\n`;
      icsContent += `DESCRIPTION:Reminder: ${title}\n`;
      icsContent += `END:VALARM\n`;
      icsContent += `END:VEVENT\n`;
    });

    // Export incomplete task dates
    taskDates.forEach(taskDate => {
      if (!taskDate.completed) { // Only export incomplete tasks
        const dateStr = format(taskDate.date, 'yyyyMMdd');
        const title = `Task: ${taskDate.label}`;
        
        icsContent += `BEGIN:VEVENT\n`;
        icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
        icsContent += `SUMMARY:${title}\n`;
        icsContent += `DESCRIPTION:${taskDate.notes || taskDate.label}\n`;
        // Add reminder 1 day before
        icsContent += `BEGIN:VALARM\n`;
        icsContent += `TRIGGER:-P1D\n`;
        icsContent += `ACTION:EMAIL\n`;
        icsContent += `DESCRIPTION:Reminder: ${title}\n`;
        icsContent += `END:VALARM\n`;
        icsContent += `END:VEVENT\n`;
      }
    });
    
    icsContent += 'END:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my-super-tc-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calendarDays = getCalendarDays();
  const monthStart = startOfMonth(currentDate);

  // Day View Component
  if (dayViewDate) {
    const allItemsForDay = [...dayViewData.dates, ...dayViewData.tasks].sort((a,b) => a.date - b.date);
    
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setDayViewDate(null)}
            className="clay-element border-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {format(dayViewDate, 'MMMM d, yyyy')}
            </h1>
            <p className="text-gray-600 mt-1">
              {allItemsForDay.length} item{allItemsForDay.length !== 1 ? 's' : ''} for this day
            </p>
          </div>
          <div className="ml-auto">
            <Button 
              onClick={() => setShowAddReminder(true)}
              className="clay-element clay-accent-mint border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Dates */}
          {dayViewData.dates.length > 0 && (
            <Card className="clay-element border-0">
              <CardHeader>
                <CardTitle className="text-xl">Transaction Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dayViewData.dates.map(dateItem => (
                    <div key={dateItem.id} className="clay-element p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`clay-element border-0 ${getDateTypeColor(dateItem.status)}`}>
                            {dateItem.status.replace('_', ' ')}
                          </Badge>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            🏠 {dateItem.label}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-1">{dateItem.transaction?.property_address}</p>
                        {dateItem.notes && (
                          <p className="text-sm text-gray-500">{dateItem.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingDateItem(dateItem)}
                        className="clay-element border-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Items */}
          {dayViewData.tasks.length > 0 && (
            <Card className="clay-element border-0">
              <CardHeader>
                <CardTitle className="text-xl">Tasks & Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dayViewData.tasks.map(taskItem => (
                    <div key={taskItem.id} className="clay-element p-4 flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`clay-element border-0 ${getDateTypeColor(taskItem.status, taskItem.completed)}`}>
                            {taskItem.completed ? 'completed' : taskItem.status.replace('_', ' ')}
                          </Badge>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            📋 {taskItem.label}
                          </h3>
                        </div>
                        {taskItem.notes && (
                          <p className="text-sm text-gray-500">{taskItem.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingDateItem(taskItem)}
                        className="clay-element border-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Reminder Sheet */}
        <Sheet open={showAddReminder} onOpenChange={setShowAddReminder}>
          <SheetContent className="clay-element border-0">
            <SheetHeader>
              <SheetTitle className="text-2xl">Add Reminder</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="task-name"
                  value={newReminder.task_name} 
                  onChange={(e) => setNewReminder(prev => ({ ...prev, task_name: e.target.value }))}
                  placeholder="Enter task name..."
                  className="clay-element border-0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Input 
                  id="due-date"
                  type="date"
                  value={newReminder.due_date} 
                  onChange={(e) => setNewReminder(prev => ({ ...prev, due_date: e.target.value }))}
                  className="clay-element border-0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transaction-select">Transaction (Optional)</Label>
                <Select 
                  value={newReminder.transaction_id} 
                  onValueChange={(value) => setNewReminder(prev => ({ ...prev, transaction_id: value }))}
                >
                  <SelectTrigger id="transaction-select" className="clay-element border-0">
                    <SelectValue placeholder="Select transaction (optional)" />
                  </SelectTrigger>
                  <SelectContent className="clay-element border-0">
                    {transactions.map(transaction => (
                      <SelectItem key={transaction.id} value={transaction.id}>
                        {transaction.property_address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes"
                  value={newReminder.notes} 
                  onChange={(e) => setNewReminder(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes..."
                  className="clay-element border-0" 
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleAddReminder} className="clay-element clay-accent-mint border-0 flex-1">
                  Add Reminder
                </Button>
                <Button variant="ghost" onClick={() => setShowAddReminder(false)} className="clay-element border-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Edit Date Sheet */}
        <Sheet open={!!editingDateItem} onOpenChange={(open) => !open && setEditingDateItem(null)}>
          <SheetContent className="clay-element border-0">
            <SheetHeader>
              <SheetTitle className="text-2xl">Edit {editingDateItem?.label}</SheetTitle>
            </SheetHeader>
            {editingDateItem && (
              <DateEditForm 
                dateItem={editingDateItem}
                onUpdate={handleUpdateDateItem}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">Important dates for all your transactions and tasks</p>
        </div>
        <Button 
          onClick={exportToCalendar}
          className="clay-element clay-accent-mint border-0"
          disabled={selectedDates.length === 0 && taskDates.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Calendar
        </Button>
      </div>

      <Card className="clay-element border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              {format(currentDate, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="clay-element border-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="clay-element border-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-8 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-600 clay-element">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(day => {
                  const { transactionDates, taskDates: dayTasks } = getDatesForDay(day);
                  const allDayItems = [...transactionDates, ...dayTasks].sort((a,b) => a.date - b.date);
                  const isCurrentMonth = day.getMonth() === monthStart.getMonth();
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={day.toISOString()}
                      className={`min-h-24 p-2 clay-element cursor-pointer hover:shadow-lg transition-all relative ${
                        !isCurrentMonth ? 'opacity-30' : ''
                      } ${isToday ? 'clay-accent-blue' : ''}`}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div className={`text-sm font-semibold mb-1 ${
                        isToday ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {allDayItems.slice(0, 2).map(dateItem => (
                          <Badge 
                            key={dateItem.id}
                            className={`clay-element border-0 text-xs p-1 block truncate ${getDateTypeColor(dateItem.status, dateItem.completed)}`}
                            title={`${dateItem.label} - ${dateItem.transaction?.property_address || 'Task'}`}
                          >
                            {dateItem.type === 'task' ? '📋' : '🏠'} {dateItem.label.split(' ')[0]}
                          </Badge>
                        ))}
                        
                        {allDayItems.length > 2 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{allDayItems.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Hover tooltip */}
                      {hoveredDay && isSameDay(hoveredDay, day) && allDayItems.length > 0 && (
                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64 max-w-xs">
                          <div className="font-semibold mb-2">{format(day, 'MMM d, yyyy')}</div>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {allDayItems.map(item => (
                              <div key={item.id} className="text-xs flex items-center gap-2">
                                <span>{item.type === 'task' ? '📋' : '🏠'}</span>
                                <span className="truncate">{item.label}</span>
                                <Badge className={`text-xs ${getDateTypeColor(item.status, item.completed)}`}>
                                  {item.completed ? 'done' : item.status.replace('_', ' ')}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Upcoming dates with task integration */}
      {([...selectedDates, ...taskDates].length > 0) && (
        <Card className="clay-element border-0">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Important Dates & Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...selectedDates, ...taskDates.filter(t => !t.completed)] // Filter to only show incomplete tasks here
                .filter(dateItem => isPast(dateItem.date) && dateItem.status === 'overdue' || dateItem.date >= new Date()) // Show overdue past items, or future items
                .sort((a, b) => a.date.getTime() - b.date.getTime()) // Use getTime for reliable sorting
                .slice(0, 10)
                .map(dateItem => (
                  <div key={dateItem.id} className={`clay-element p-4 flex justify-between items-center ${
                    dateItem.status === 'overdue' ? 'border-l-4 border-red-500' : ''
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {format(dateItem.date, 'd')}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">
                          {format(dateItem.date, 'MMM')}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {dateItem.type === 'task' ? '📋' : '🏠'} {dateItem.label}
                        </h3>
                        <p className="text-gray-600">
                          {dateItem.transaction?.property_address || (dateItem.type === 'task' && dateItem.task?.transaction_id ? transactions.find(t => t.id === dateItem.task.transaction_id)?.property_address : 'Task Item')}
                        </p>
                      </div>
                    </div>
                    <Badge className={`clay-element border-0 ${getDateTypeColor(dateItem.status)}`}>
                      {dateItem.status === 'overdue' ? 'OVERDUE' : dateItem.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DateEditForm({ dateItem, onUpdate }) {
  const [date, setDate] = useState(format(dateItem.date, 'yyyy-MM-dd'));
  const [status, setStatus] = useState(dateItem.status);
  const [notes, setNotes] = useState(dateItem.notes);

  const handleSave = () => {
    onUpdate(dateItem, { date, status, notes });
  };

  return (
    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <Label htmlFor="edit-date">Date</Label>
        <Input 
          id="edit-date"
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="clay-element border-0"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="edit-status" className="clay-element border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="clay-element border-0">
            {dateItem.type === 'transaction' ? (
              <>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="extended">Extended</SelectItem>
              </>
            ) : ( // For task items
              <>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-notes">Notes</Label>
        <Textarea 
          id="edit-notes"
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          className="clay-element border-0" 
          rows={4}
          placeholder="Add any notes about this important date..."
        />
      </div>
      
      <Button onClick={handleSave} className="clay-element clay-accent-mint border-0 w-full">
        Save Changes
      </Button>
    </div>
  );
}
