
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format, parseISO, differenceInDays, isPast, add, isWeekend } from 'date-fns';

const DATE_DEFINITIONS = [
  { key: 'original_contract_date', label: 'Original Contract Date', base: null, isBusinessDays: false },
  { key: 'offer_acceptance_date', label: 'Offer Acceptance', base: null, isBusinessDays: false },
  { key: 'emd_due_date', label: 'Earnest Money Deposit', base: 'offer_acceptance_date', isBusinessDays: true },
  { key: 'seller_disclosures_date', label: 'Seller Disclosures Delivery', base: 'offer_acceptance_date' },
  { key: 'investigation_contingency_date', label: 'Investigation Contingency', base: 'offer_acceptance_date' },
  { key: 'appraisal_contingency_date', label: 'Appraisal Contingency', base: 'offer_acceptance_date' },
  { key: 'loan_contingency_date', label: 'Loan Contingency', base: 'offer_acceptance_date' },
  { key: 'disclosures_due_back_date', label: 'Disclosures Due Back', base: 'seller_disclosures_date' },
  { key: 'final_walkthrough_date', label: 'Final Walkthrough', base: 'close_of_escrow_date' },
  { key: 'close_of_escrow_date', label: 'Close of Escrow', base: 'offer_acceptance_date' },
  { key: 'possession_date', label: 'Date of Possession', base: 'close_of_escrow_date' },
];

const STATUS_GROUPS = [
  { title: "Overdue", key: "overdue" },
  { title: "In Progress", key: "in_progress" },
  { title: "Negotiating", key: "negotiating" },
  { title: "Extended", key: "extended" },
  { title: "Completed", key: "completed" },
  { title: "Waived", key: "waived" }
];

const statusOptions = ["in_progress", "completed", "overdue", "waived", "negotiating", "extended"];

const getStatusInfo = (status, date) => {
  if (status === 'completed' || status === 'waived') return { color: 'bg-green-100 text-green-700', icon: CheckCircle };
  if (status === 'overdue' || (date && isPast(date) && status !== 'completed' && status !== 'waived')) return { color: 'bg-red-100 text-red-700', icon: AlertCircle };
  return { color: 'bg-blue-100 text-blue-700', icon: Clock };
};

export default function ImportantDates({ transaction, onUpdate, transactionId }) {
  const [openSheetKey, setOpenSheetKey] = useState(null);

  const groupedDates = useMemo(() => {
    const dates = DATE_DEFINITIONS.map(def => {
      const date = transaction[def.key] ? parseISO(transaction[def.key]) : null;
      let status = transaction[`${def.key}_status`] || 'in_progress';
      const notes = transaction[`${def.key}_notes`] || '';
      const daysRemaining = date ? differenceInDays(date, new Date()) : null;

      // Force original contract date to always be completed
      if (def.key === 'original_contract_date') {
        status = 'completed';
      } else if (def.key === 'offer_acceptance_date' && date) {
        status = 'completed';
      } else if (date && isPast(date) && status !== 'completed' && status !== 'waived') {
        status = 'overdue';
      }

      return { ...def, date, status, notes, daysRemaining };
    });

    const groups = {};
    STATUS_GROUPS.forEach(g => { groups[g.key] = []; });

    dates.forEach(dateItem => {
      if (groups[dateItem.status]) {
        groups[dateItem.status].push(dateItem);
      }
    });

    Object.values(groups).forEach(group => {
      group.sort((a, b) => (a.date || new Date('2999-12-31')) - (b.date || new Date('2999-12-31')));
    });

    return groups;
  }, [transaction]);

  const handleUpdate = async (key, data) => {
    const updatePayload = {
      [key]: data.date,
      [`${key}_status`]: data.status,
      [`${key}_notes`]: data.notes,
    };
    await onUpdate(updatePayload);
    setOpenSheetKey(null);
  };

  const generateICS = (dateItem) => {
    const dateStr = format(dateItem.date, 'yyyyMMdd');
    const propertyAddressShort = transaction.property_address?.split(',')[0]?.trim() || 'Property';
    const title = `${dateItem.label} - ${propertyAddressShort}`;

    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Super TC//Transaction Calendar//EN\n';
    icsContent += `BEGIN:VEVENT\n`;
    icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
    icsContent += `SUMMARY:${title}\n`;
    icsContent += `DESCRIPTION:${dateItem.notes || dateItem.label}\n`; // Changed description to fallback to label
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

  const generateTransactionCalendar = () => {
    const propertyAddressShort = transaction.property_address?.split(',')[0]?.trim() || 'Property';
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Super TC//Transaction Calendar//EN\n';

    // Add all important dates for this transaction
    DATE_DEFINITIONS.forEach(def => {
      const date = transaction[def.key];
      if (date) {
        const dateStr = format(parseISO(date), 'yyyyMMdd');
        const title = `${def.label} - ${propertyAddressShort}`;
        const notes = transaction[`${def.key}_notes`] || '';

        icsContent += `BEGIN:VEVENT\n`;
        icsContent += `DTSTART;VALUE=DATE:${dateStr}\n`;
        icsContent += `SUMMARY:${title}\n`;
        icsContent += `DESCRIPTION:${notes || def.label}\n`;
        icsContent += `BEGIN:VALARM\n`;
        icsContent += `TRIGGER:-P1D\n`;
        icsContent += `ACTION:DISPLAY\n`;
        icsContent += `DESCRIPTION:Reminder: ${title}\n`;
        icsContent += `END:VALARM\n`;
        icsContent += `END:VEVENT\n`;
      }
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transaction-${transactionId}-calendar.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <Card className="clay-element border-0">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Important Dates</CardTitle>
        <div className="flex gap-2"> {/* Group buttons to prevent overlap on smaller screens */}
          <Button
            onClick={generateTransactionCalendar}
            variant="outline"
            size="sm"
            className="clay-element border-0"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {STATUS_GROUPS.map(group => {
          const datesInGroup = groupedDates[group.key];
          if (!datesInGroup || datesInGroup.length === 0) return null;

          return (
            <div key={group.key}>
              <h4 className="font-semibold text-md mb-2 text-gray-500">{group.title}</h4>
              <div className="space-y-3">
                {datesInGroup.map(dateItem => {
                  const statusInfo = getStatusInfo(dateItem.status, dateItem.date);
                  const isUrgent = dateItem.daysRemaining !== null && dateItem.daysRemaining >= 0 && dateItem.daysRemaining <= 2 && dateItem.status !== 'completed' && dateItem.status !== 'waived';

                  return (
                    <Sheet key={dateItem.key} open={openSheetKey === dateItem.key} onOpenChange={(isOpen) => setOpenSheetKey(isOpen ? dateItem.key : null)}>
                      <SheetTrigger asChild>
                        <div className={`tooltip p-3 rounded-xl cursor-pointer transition-all ${isUrgent ? 'clay-element shadow-lg' : ''}`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusInfo.color}`}>
                                <statusInfo.icon className="w-5 h-5"/>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{dateItem.label}</p>
                                <p className="text-sm text-gray-500">
                                  {dateItem.date ? format(dateItem.date, 'MMM d, yyyy') : 'TBD'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {dateItem.daysRemaining !== null && dateItem.status !== 'completed' && dateItem.status !== 'waived' && (
                                <p className={`text-sm font-semibold ${dateItem.daysRemaining < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                                  {dateItem.daysRemaining < 0 ? `${-dateItem.daysRemaining} days overdue` : `${dateItem.daysRemaining} days left`}
                                </p>
                              )}
                            </div>
                          </div>
                          {/* Tooltip for notes */}
                          {dateItem.notes && (
                            <div className="tooltip-content text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                              <strong>Notes:</strong><br />
                              {dateItem.notes}
                            </div>
                          )}
                        </div>
                      </SheetTrigger>
                      <SheetContent className="clay-element border-0">
                        <SheetHeader>
                          <SheetTitle className="text-2xl">{dateItem.label}</SheetTitle>
                        </SheetHeader>
                        <DateEditForm dateItem={dateItem} transaction={transaction} onUpdate={handleUpdate} generateICS={generateICS} />
                      </SheetContent>
                    </Sheet>
                  );
                })}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function DateEditForm({ dateItem, transaction, onUpdate, generateICS }) {
  const [date, setDate] = useState(dateItem?.date ? format(dateItem.date, 'yyyy-MM-dd') : '');
  const [days, setDays] = useState('');
  const [status, setStatus] = useState(dateItem?.status);
  const [notes, setNotes] = useState(dateItem?.notes || '');

  const currentDef = DATE_DEFINITIONS.find(d => d.key === dateItem.key);
  const isOfferAcceptance = currentDef?.key === 'offer_acceptance_date';
  const isOriginalContract = currentDef?.key === 'original_contract_date'; // New check for original contract date

  const handleSave = () => {
    // Force original contract date to always be completed
    const finalStatus = isOriginalContract || isOfferAcceptance ? 'completed' : status;
    onUpdate(dateItem.key, { date, status: finalStatus, notes });
  };

  const handleDateCalculation = (daysInput) => {
    setDays(daysInput);
    if (!currentDef) return;
    const baseDateStr = transaction[currentDef.base];
    if (baseDateStr && daysInput) {
      let result = parseISO(baseDateStr);
      let count = parseInt(daysInput);
      if (currentDef.isBusinessDays) {
        let added = 0;
        while(added < count) {
          result = add(result, { days: 1 });
          if (!isWeekend(result)) added++;
        }
      } else {
        result = add(result, { days: count });
      }
      // Ensure the calculated date doesn't fall on a weekend if it's not a business day calculation
      // and if the original definition doesn't care, but we want to push it to the next Monday.
      // This is a general rule, can be adjusted based on specific requirements.
      while (isWeekend(result)) {
        result = add(result, { days: 1 });
      }
      setDate(format(result, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="space-y-6 py-6">
      <div className="space-y-2">
        <Label>Date</Label>
        {currentDef.base && (
          <Input
            type="number"
            placeholder={`Days from ${DATE_DEFINITIONS.find(d => d.key === currentDef.base)?.label}`}
            value={days}
            onChange={(e) => handleDateCalculation(e.target.value)}
            className="clay-element border-0 mb-2"
          />
        )}
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="clay-element border-0"/>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        {isOfferAcceptance || isOriginalContract ? (
          <Input value="Completed" disabled className="clay-element border-0"/>
        ) : (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="clay-element border-0"><SelectValue/></SelectTrigger>
            <SelectContent className="clay-element border-0">
              {statusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="clay-element border-0" rows={5}/>
      </div>
      <div className="flex justify-between items-center">
        <Button onClick={handleSave} className="clay-element clay-accent-mint border-0">Save Changes</Button>
        <Button variant="ghost" size="icon" onClick={() => generateICS(dateItem)} className="clay-element border-0" disabled={!date}>
          <Download className="w-5 h-5"/>
        </Button>
      </div>
    </div>
  );
}
