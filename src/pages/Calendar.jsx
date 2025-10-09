import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock,
  Edit,
  Plus,
  X
} from "lucide-react";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isPast,
  differenceInDays
} from "date-fns";

const DATE_FIELD_LABELS = {
  original_contract_date: "Original Contract Date",
  offer_acceptance_date: "Offer Acceptance Date",
  emd_due_date: "Earnest Money Deposit Due",
  investigation_contingency_date: "Investigation Contingency",
  loan_contingency_date: "Loan Contingency",
  appraisal_contingency_date: "Appraisal Contingency",
  seller_disclosures_date: "Seller Disclosures",
  disclosures_due_back_date: "Disclosures Due Back",
  close_of_escrow_date: "Close of Escrow",
  final_walkthrough_date: "Final Walkthrough",
  possession_date: "Date of Possession"
};

export default function Calendar() {
  const [transactions, setTransactions] = useState([]);
  const [taskDates, setTaskDates] = useState([]);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [dayViewOpen, setDayViewOpen] = useState(false);
  const [dayViewDate, setDayViewDate] = useState(null);
  const [dayViewData, setDayViewData] = useState({ dates: [], tasks: [] });

  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [addReminderOpen, setAddReminderOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    task_name: "",
    due_date: "",
    notes: "",
    transaction_id: ""
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [showMoreUpcoming, setShowMoreUpcoming] = useState(false);
  const upcomingScrollRef = useRef(null);

  // ---------------------------
  // Data Fetch
  // ---------------------------
  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase.from("transactions").select("*");
    if (!error) {
      setTransactions(data || []);
      extractImportantDates(data || []);
    }
  }, []);

  const extractImportantDates = useCallback((data) => {
    const dates = [];
    data.forEach((t) => {
      Object.keys(DATE_FIELD_LABELS).forEach((key) => {
        const dateValue = t[key];
        if (dateValue) {
          dates.push({
            id: `${t.id}-${key}`,
            date: parseISO(dateValue),
            label: DATE_FIELD_LABELS[key],
            transaction: t,
            dateKey: key,
            status: t[`${key}_status`] || "in_progress",
            notes: t[`${key}_notes`] || "",
            type: "transaction"
          });
        }
      });
    });
    dates.sort((a, b) => a.date - b.date);
    setSelectedDates(dates);
  }, []);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from("task_items").select("*");
    if (!error) {
      const tasks = (data || []).map((task) => ({
        id: `task-${task.id}`,
        date: task.due_date ? parseISO(task.due_date) : null,
        label: task.task_name,
        task,
        status: task.completed ? "completed" : "pending",
        notes: task.notes || "",
        type: "task",
        completed: task.completed
      }));
      setTaskDates(tasks);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchTasks();
  }, [fetchTransactions, fetchTasks]);

  // ---------------------------
  // Helpers
  // ---------------------------
  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  };

  const getDatesForDay = (day) => {
    const tDates = selectedDates.filter((d) => isSameDay(d.date, day));
    const tasks = taskDates.filter((t) => t.date && isSameDay(t.date, day));
    return { transactionDates: tDates, taskDates: tasks };
  };

  const openDayView = (day) => {
  const { transactionDates, taskDates: dayTasks } = getDatesForDay(day);
  if (transactionDates.length > 0 || dayTasks.length > 0) {
    setDayViewData({ dates: transactionDates, tasks: dayTasks });
    setDayViewDate(day);
    setDayViewOpen(true);

    // Auto-select transaction for reminders from this day
    if (transactionDates.length > 0) {
      setNewReminder((prev) => ({
        ...prev,
        due_date: format(day, "yyyy-MM-dd"),
        transaction_id: transactionDates[0].transaction.id
      }));
    }
  } else {
    setNewReminder((prev) => ({ ...prev, due_date: format(day, "yyyy-MM-dd") }));
    setAddReminderOpen(true);
  }
};
  const humanizeStatus = (s) =>
    s ? s.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  const isOverdue = (item) => {
    if (!item.date) return false;
    const exempt = ["extended", "negotiating", "waived", "completed"];
    return isPast(item.date) && !exempt.includes(item.status);
  };

  const isDueSoon = (item) => {
    if (!item.date) return false;
    const days = differenceInDays(item.date, new Date());
    return days >= 0 && days <= 2 && !isOverdue(item) && item.status !== "completed";
  };

  const badgeTone = (item) => {
    if (item.completed) return "bg-gray-100 text-gray-500";
    if (isOverdue(item)) return "bg-red-100 text-red-700 border-l-4 border-red-500";
    if (isDueSoon(item)) return "bg-yellow-100 text-yellow-700";
    switch (item.status) {
      case "completed": return "bg-gray-200 text-gray-600";
      case "in_progress": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-blue-100 text-blue-700";
      case "extended": return "bg-yellow-50 text-yellow-700";
      case "negotiating": return "bg-orange-100 text-orange-700";
      case "waived": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // ---------------------------
  // Upcoming List
  // ---------------------------
  const allActiveItems = useMemo(
    () => [...selectedDates, ...taskDates].filter((i) => i.status !== "completed"),
    [selectedDates, taskDates]
  );

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") return allActiveItems;
    return allActiveItems.filter((i) => i.status === statusFilter);
  }, [allActiveItems, statusFilter]);

  const upcomingItems = useMemo(
    () => filteredItems.filter((i) => i.date).sort((a, b) => a.date - b.date),
    [filteredItems]
  );

 const upcomingWindow = useMemo(() => {
  if (showMoreUpcoming) {
    return upcomingItems; // show all when expanded
  }
  return upcomingItems.slice(0, 5); // default: only 5
}, [upcomingItems, showMoreUpcoming]);


  // ---------------------------
  // Add Reminder
  // ---------------------------
  const handleAddReminder = async () => {
    if (!newReminder.task_name || !newReminder.due_date) return;
    const defaultTx = transactions.find((t) => !["closed", "cancelled"].includes(t.status))?.id;
    await supabase.from("task_items").insert([
      {
        task_name: newReminder.task_name,
        due_date: newReminder.due_date,
        notes: newReminder.notes || null,
        transaction_id: newReminder.transaction_id || defaultTx,
        section: "broker_disclosures",
        completed: false
      }
    ]);
    setAddReminderOpen(false);
    setNewReminder({ task_name: "", due_date: "", notes: "", transaction_id: "" });
    fetchTasks();
  };

  // ---------------------------
  // Edit
  // ---------------------------
  const openEditModal = (item) => {
  let enrichedItem = { ...item };

  // If it's a task, resolve its transaction object
  if (item.type === "task" && item.task?.transaction_id) {
    const tx = transactions.find((t) => t.id === item.task.transaction_id);
    if (tx) {
      enrichedItem = { ...item, transaction: tx };
    }
  }

  setEditingItem(enrichedItem);
  setEditOpen(true);
};

  const handleSaveEdit = async (payload) => {
    if (editingItem.type === "transaction") {
      const update = {
        [editingItem.dateKey]: payload.date || null,
        [`${editingItem.dateKey}_status`]: payload.status || editingItem.status,
        [`${editingItem.dateKey}_notes`]: payload.notes ?? editingItem.notes
      };
      await supabase.from("transactions").update(update).eq("id", editingItem.transaction.id);
      await fetchTransactions();
    } else {
      await supabase.from("task_items").update({
        due_date: payload.date || null,
        notes: payload.notes ?? editingItem.notes,
        completed: payload.status === "completed"
      }).eq("id", editingItem.task.id);
      await fetchTasks();
    }
    setEditOpen(false);
    setEditingItem(null);
  };

  // ---------------------------
  // Render
  // ---------------------------
  const calendarDays = getCalendarDays();
  const monthStart = startOfMonth(currentDate);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendar</h1>
          <p className="text-white/80 mt-1">Important dates for all your transactions and tasks</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-gray-800 text-white border-gray-700 min-w-[200px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="extended">Extended</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setAddReminderOpen(true)} className="clay-element clay-accent-mint border-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
          <Button onClick={() => console.log("Export")} className="clay-element clay-accent-blue border-0">
            <Download className="w-4 h-4 mr-2" />
            Export to Calendar
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="clay-element border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">
              {format(currentDate, "MMMM yyyy")}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center font-semibold text-gray-600 clay-element">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const { transactionDates, taskDates: tasks } = getDatesForDay(day);
              const items = [...transactionDates, ...tasks].sort((a, b) => a.date - b.date);
              const isCurrentMonth = day.getMonth() === monthStart.getMonth();
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-2 clay-element cursor-pointer hover:shadow-lg transition-all ${
                    !isCurrentMonth ? "opacity-30" : ""
                  } ${isToday ? "clay-accent-blue" : ""}`}
                  onClick={() => openDayView(day)}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-700" : "text-gray-700"}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 2).map((item) => (
  <div key={item.id} className="relative group">
    <Badge
      className={`clay-element border-0 text-xs p-1 block truncate ${badgeTone(item)}`}
    >
      {item.type === "task" ? "📋" : "🏠"} {item.label}
    </Badge>

    {/* Floating white hover card */}
    <div className="absolute z-50 hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-3">
      <div className="font-semibold text-gray-900 mb-1">
        {format(item.date, "MMMM d, yyyy")}
      </div>
      <div className="text-sm text-gray-700">{item.label}</div>
      {item.transaction?.property_address && (
        <div className="text-xs text-gray-500">{item.transaction.property_address}</div>
      )}
      {item.notes && (
        <div className="text-xs text-gray-600 italic mt-1">{item.notes}</div>
      )}
    </div>
  </div>
))}                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Important Dates & Tasks */}
      {upcomingItems.length > 0 && (
        <Card className="clay-element border-0">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Important Dates & Tasks
            </CardTitle>
          </CardHeader>
          <CardContent
  ref={upcomingScrollRef}
  className={`${
    showMoreUpcoming ? "max-h-[550px] overflow-y-auto" : "max-h-none"
  }`}
>
            <div className="space-y-3">
              {upcomingWindow.map((item) => (
                <div
  key={item.id}
  onClick={() => openEditModal(item)}
  className={`relative group clay-element p-4 flex justify-between items-center border hover:shadow cursor-pointer
    ${isOverdue(item) ? "border-l-4 border-red-500 bg-red-50" : ""}
    ${isDueSoon(item) ? "border-l-4 border-yellow-500 bg-yellow-50" : ""}
  `}
>
  <div className="flex items-center gap-4">
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">
        {format(item.date, "d")}
      </div>
      <div className="text-xs text-gray-500 uppercase">
        {format(item.date, "MMM")}
      </div>
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        {item.type === "task" ? "📋" : "🏠"} {item.label}
      </h3>
      <p className="text-gray-600">
        {item.transaction?.property_address ||
          (item.type === "task" && item.task?.transaction_id
            ? transactions.find((t) => t.id === item.task.transaction_id)?.property_address
            : "Task Item")}
      </p>
    </div>
  </div>

  <Badge className={`clay-element border-0 ${badgeTone(item)}`}>
    {isOverdue(item) ? "Overdue" : humanizeStatus(item.status)}
  </Badge>

    {/* Floating white hover card */}
<div className="absolute z-50 hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
  <div className="font-semibold text-gray-900 mb-2">
    {format(item.date, "MMMM d, yyyy")}
  </div>
  <div className="text-sm text-gray-700">{item.label}</div>
  {item.transaction?.property_address && (
    <div className="text-xs text-gray-500">{item.transaction.property_address}</div>
  )}
  {item.notes && (
    <div className="text-xs text-gray-600 italic mt-2">{item.notes}</div>
  )}
</div>
{/* closes the outer card div */}
</div>
              ))}
            </div>
            {upcomingItems.length > 5 && (
  <div className="mt-3">
    <Button
      onClick={() => setShowMoreUpcoming((p) => !p)}
      className="w-full clay-element"
      variant="outline"
    >
      {showMoreUpcoming ? "Show Less" : "Show More"}
    </Button>
  </div>
)}
          </CardContent>
        </Card>
      )}

            {/* Day View Dialog */}
      <Dialog open={dayViewOpen} onOpenChange={setDayViewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {dayViewDate ? format(dayViewDate, "MMMM d, yyyy") : "Day View"}
            </DialogTitle>
          </DialogHeader>

          {/* Transaction Dates */}
          {dayViewData.dates.length > 0 && (
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-gray-900">Transaction Dates</h3>
              {dayViewData.dates.map((d) => (
                <div
  key={item.id}
  onClick={() => openEditModal(item)}
  className={`clay-element p-4 flex justify-between items-center cursor-pointer transition
    hover:shadow-md hover:border-gray-300
    ${isOverdue(item) ? "border-l-4 border-red-500" : ""}
    ${isDueSoon(item) ? "border-l-4 border-yellow-500" : ""}
  `}
>
                  <div>
                    <p className="font-medium">{d.label}</p>
                    <p className="text-sm text-gray-600">
                      {d.transaction?.property_address || "Transaction"}
                    </p>
                  </div>
                  <Badge className={`clay-element border-0 ${badgeTone(d)}`}>
                    {isOverdue(d) ? "Overdue" : humanizeStatus(d.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          {dayViewData.tasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Reminders / Tasks</h3>
              {dayViewData.tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openEditModal(t)}
                  className="clay-element p-3 flex justify-between items-center cursor-pointer hover:shadow"
                >
                  <div>
                    <p className="font-medium">{t.label}</p>
                    <p className="text-sm text-gray-600">
                      {transactions.find((x) => x.id === t.task.transaction_id)?.property_address || "Task"}
                    </p>
                  </div>
                  <Badge className={`clay-element border-0 ${badgeTone(t)}`}>
                    {isOverdue(t) ? "Overdue" : humanizeStatus(t.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={addReminderOpen} onOpenChange={setAddReminderOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Reminder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task Name</Label>
              <Input
                value={newReminder.task_name}
                onChange={(e) => setNewReminder((p) => ({ ...p, task_name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newReminder.due_date}
                onChange={(e) => setNewReminder((p) => ({ ...p, due_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Transaction</Label>
              <Select
                value={newReminder.transaction_id}
                onValueChange={(v) => setNewReminder((p) => ({ ...p, transaction_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {transactions.filter((t) => !["closed", "cancelled"].includes(t.status)).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.property_address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newReminder.notes}
                onChange={(e) => setNewReminder((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddReminder} className="clay-element clay-accent-mint border-0">
              Add Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingItem?.label ? `Edit — ${editingItem.label}` : "Edit Item"}
            </DialogTitle>
          </DialogHeader>

          {editingItem && (
            <DateEditForm
              item={editingItem}
              onSave={handleSaveEdit}
              onCancel={() => setEditOpen(false)}
              transactions={transactions}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** --- Edit Form --- */
function DateEditForm({ item, onSave, onCancel, transactions }) {
  const initDate = item.date ? format(item.date, "yyyy-MM-dd") : "";
  const [date, setDate] = useState(initDate);
  const [status, setStatus] = useState(item.status || "in_progress");
  const [notes, setNotes] = useState(item.notes || "");
  const [transactionId, setTransactionId] = useState(
  item.transaction?.id ||
  item.task?.transaction_id ||
  transactions.find((t) => !["closed", "cancelled"].includes(t.status))?.id || ""
);
  const isTask = item.type === "task";

  const handleSave = () => {
    onSave({ date: date || null, status, notes, transaction_id: transactionId });
  };

  return (
    <div className="space-y-6">
      <div>
        <Label>Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div>
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {isTask ? (
              <>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="extended">Extended</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="extended">Extended</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Transaction</Label>
        <Select value={transactionId} onValueChange={setTransactionId}>
          <SelectTrigger><SelectValue placeholder="Select transaction" /></SelectTrigger>
          <SelectContent>
            {transactions.filter((t) => !["closed", "cancelled"].includes(t.status)).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.property_address}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button onClick={handleSave} className="clay-element clay-accent-mint">Save</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}