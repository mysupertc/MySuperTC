
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, ChevronDown, ChevronUp, Calendar, AlertTriangle, ChevronsUpDown, Check } from 'lucide-react';
import { format, parseISO, isPast, isSameDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

// Import the same optional documents list from TemplateManager
const optionalDocuments = [
    { section: "purchase_agreement", document_name: "(ADM#1) Addendum No.1" },
    { section: "purchase_agreement", document_name: "(AEA) Amendment of Existing Agreement" },
    { section: "purchase_agreement", document_name: "(BCO#1) - Buyer Counter Offer No. 1" },
    { section: "purchase_agreement", document_name: "(BCO#2) - Buyer Counter Offer No. 2" },
    { section: "purchase_agreement", document_name: "(CR#2) Contingency Removal No. 2", no_seller_buyer: true },
    { section: "purchase_agreement", document_name: "(CR#3) Contingency Removal No. 3", no_seller_buyer: true },
    { section: "purchase_agreement", document_name: "(CR#4) Contingency Removal No. 4", no_seller_buyer: true },
    { section: "purchase_agreement", document_name: "(ETA) Extension of Time Amendment" },
    { section: "purchase_agreement", document_name: "(RPA) Purchase Contract" },
    { section: "purchase_agreement", document_name: "(RIPA) Residential Income Purchase Contract" },
    { section: "purchase_agreement", document_name: "(RR#1) Request for Repairs No. 1" },
    { section: "purchase_agreement", document_name: "(RR#2) Request for Repairs No. 2" },
    { section: "purchase_agreement", document_name: "(RRRR#1) Response & Buyer Reply to Request for Repair No. 1" },
    { section: "purchase_agreement", document_name: "(RRRR#2) Response & Buyer Reply to Request for Repair No. 2" },
    { section: "purchase_agreement", document_name: "(SCO#1) - Seller Counter Offer No. 1" },
    { section: "purchase_agreement", document_name: "(SCO#2) - Seller Counter Offer No. 2" },
    { section: "purchase_agreement", document_name: "(SMCO#1) - Seller Multiple Counter Offer No. 1" },
    { section: "purchase_agreement", document_name: "(SMCO#2) - Seller Multiple Counter Offer No. 2" },
    { section: "disclosures", document_name: "(AAA) Additional Agent Acknowledgment" },
    { section: "disclosures", document_name: "(ABA) Additional Broker Acknowledgment" },
    { section: "disclosures", document_name: "(AC) Agency Confirmation" },
    { section: "disclosures", document_name: "(AD) Disclosure Regarding Real Estate Agency Relationship" },
    { section: "disclosures", document_name: "(ADM#1) Addendum No. 1" },
    { section: "disclosures", document_name: "(AOAA) Assignment of Agreement" },
    { section: "disclosures", document_name: "(BBD) Bed Bug Disclosure" },
    { section: "disclosures", document_name: "(BIE) Buyer's Investigation Elections" },
    { section: "disclosures", document_name: "(BIW) Buyer's Inspection Waiver" },
    { section: "disclosures", document_name: "(COOP-OA) Stock Cooperative Ownership Advisory" },
    { section: "disclosures", document_name: "(COOP-PA) Stock Cooperative Purchase Addendum" },
    { section: "disclosures", document_name: "(PSRA) Property Showing & Representation Agreement" },
    { section: "disclosures", document_name: "(RCJC) Rent Cap & Just Cause Addendum" },
    { section: "disclosures", document_name: "(RCSD-B/S) Representative Capacity Seller Disclosure" },
    { section: "disclosures", document_name: "(RFR) Receipt for Reports" },
    { section: "disclosures", document_name: "(RLAS) Residential Lease After Sale (Sale Leaseback Over 30 Days)" },
    { section: "disclosures", document_name: "(SDDA) Security Deposit Disclosure" },
    { section: "disclosures", document_name: "(SFA) Seller Financing Addendum" },
    { section: "disclosures", document_name: "(SIP) Seller in Possession Addendum" },
    { section: "disclosures", document_name: "(SNA) Seller Non-agency Agreement" },
    { section: "disclosures", document_name: "(SP) Single Party Compensation Agreement" },
    { section: "disclosures", document_name: "(TFHD) Tenant Flood Hazard Disclosure" },
];

// Add From Master List Component
function AddFromMasterList({ onAdd, existingItems, sectionKey }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    const availableDocs = useMemo(() => {
        const existingNames = new Set(existingItems.map(item => item.document_name));
        return optionalDocuments.filter(doc => 
            !existingNames.has(doc.document_name) && doc.section === sectionKey
        );
    }, [existingItems, sectionKey]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="clay-element border-0 justify-between w-[300px]"
                    size="sm"
                >
                    <span className="truncate">Add from document library...</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search document..." />
                    <CommandEmpty>No document found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                        {availableDocs.map((doc) => (
                            <CommandItem
                                key={doc.document_name}
                                value={doc.document_name}
                                onSelect={(currentValue) => {
                                    // currentValue is the value of the selected CommandItem, which is doc.document_name
                                    const selectedDoc = availableDocs.find(d => d.document_name.toLowerCase() === currentValue.toLowerCase());
                                    if(selectedDoc) {
                                        onAdd(selectedDoc);
                                    }
                                    setValue(""); // Clear the value after selection
                                    setOpen(false); // Close the popover
                                }}
                            >
                                <Check className={`mr-2 h-4 w-4 ${value === doc.document_name ? "opacity-100" : "opacity-0"}`} />
                                {doc.document_name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// --- START: STABLE, DEBOUNCED GENERIC INPUT ---
const DebouncedInput = ({ value, onChange, type = "text", ...props }) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    // If the external 'value' prop changes AND it's different from our current 'localValue'
    // then update 'localValue' to reflect the external change.
    // This handles cases where the parent data updates from a source other than this input
    // (e.g., initial load, another user's change, API refresh).
    // It prevents infinite loops by checking for difference.
    if (value !== localValue) {
        setLocalValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Dependency on 'value' prop.

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue); // Update local state immediately for responsive UI

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onChange(newValue); // Call parent onChange after debounce
    }, 500); // Longer delay for checklist notes
  };

  return <Input {...props} type={type} value={localValue || ''} onChange={handleChange} />;
}
// --- END: STABLE, DEBOUNCED GENERIC INPUT ---

function ItemRow({ item, columns, onUpdate, onDelete, isNew = false, onAddNew, sectionKey }) {
  const [newItemData, setNewItemData] = useState({});

  const handleUpdate = useCallback((field, value) => {
      if (!isNew) {
          // Pass a partial update object { [field]: value } to the parent's onUpdate
          onUpdate(item.id, { [field]: value });
      }
  }, [isNew, item?.id, onUpdate]); // Depend on item.id for stability of the callback

  const handleNewItemChange = (field, value) => {
    setNewItemData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddClick = useCallback(() => {
    const requiredField = columns.find(c => c.type === 'text')?.key;
    // Check if the required text field has a value before adding
    if (!newItemData || !newItemData[requiredField]) {
      return;
    }
    onAddNew(newItemData);
    setNewItemData({}); // Clear the new item data after adding
  }, [newItemData, columns, onAddNew]);

  // isCompleted and isOverdue checks now directly use the 'item' prop for existing items
  const isCompleted = !isNew && item && item.isCompleted;
  const isOverdue = !isNew && item && item.due_date && isPast(parseISO(item.due_date)) && !item.completed;

  return (
    <tr className={`${isCompleted ? 'bg-gray-100 opacity-75' : 'bg-white hover:bg-gray-50'} ${isOverdue ? 'border-l-4 border-red-500' : ''}`}>
      {columns.map(col => (
        <td key={col.key} className="p-3 align-middle relative">
          {col.type === 'checkbox' ? (
            <div className="flex justify-center">
              <Checkbox
                // For new items, use newItemData. For existing, use item prop.
                checked={isNew ? (newItemData[col.key] || false) : (item[col.key] || false)}
                onCheckedChange={(checked) => {
                  if (isNew) handleNewItemChange(col.key, checked);
                  else handleUpdate(col.key, checked); // Checkboxes update immediately, no debounce needed
                }}
                className={isCompleted ? 'border-gray-400' : ''}
              />
            </div>
          ) : (
            <div className="relative">
              <DebouncedInput
                type={col.type} // Pass the column type (e.g., "text", "date") to the input
                placeholder={isNew ? `Enter ${col.title.toLowerCase()}...` : ''}
                // For new items, use newItemData. For existing, use item prop.
                value={isNew ? (newItemData[col.key] || '') : (item[col.key] || '')}
                onChange={(value) => {
                    if (isNew) handleNewItemChange(col.key, value);
                    else handleUpdate(col.key, value); // DebouncedInput handles the debounce before calling handleUpdate
                }}
                className={`w-full bg-transparent border-0 focus:ring-1 focus:ring-blue-200 px-2 py-1 text-sm ${
                  isCompleted ? 'line-through text-gray-500 placeholder-gray-400' : ''
                }`}
              />
              {isOverdue && col.key === columns.find(c => c.type === 'text')?.key && ( // Display overdue badge on the first text column
                <div className="absolute -top-1 -right-1">
                  <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <AlertTriangle className="w-3 h-3" />
                    Overdue
                  </div>
                </div>
              )}
            </div>
          )}
        </td>
      ))}
      <td className="p-3 align-middle w-12">
        {isNew ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleAddClick} 
            className="text-green-600 hover:bg-green-50 hover:text-green-700 h-8 w-8 p-0"
            // Disable add button if the required text field is empty
            disabled={!newItemData[columns.find(c => c.type === 'text')?.key]}
          >
            <Plus className="w-4 h-4"/>
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(item.id)} 
            className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
          >
            <Trash2 className="w-3 h-3"/>
          </Button>
        )}
      </td>
    </tr>
  );
}

export default function Checklist({ title, items, ItemEntity, transactionId, sections, columns, onUpdate, completionLogic }) {
  const [showArchived, setShowArchived] = useState({});

  const groupedItems = useMemo(() => {
    const grouped = {};
    for (const section of sections) {
      const sectionItemsWithCompletion = items
        .filter(item => item.section === section.key)
        .map(item => ({ ...item, isCompleted: completionLogic(item) }));
        
      grouped[section.key] = {
        pending: sectionItemsWithCompletion.filter(item => !item.isCompleted),
        completed: sectionItemsWithCompletion.filter(item => item.isCompleted)
      };
    }
    return grouped;
  }, [items, sections, completionLogic]);
  
  const totalItems = items.length;
  const totalCompleted = useMemo(() => items.filter(item => completionLogic(item)).length, [items, completionLogic]);
  const totalPending = totalItems - totalCompleted;
  const totalOverdue = useMemo(() => items.filter(item => !completionLogic(item) && item.due_date && isPast(parseISO(item.due_date))).length, [items, completionLogic]);

  const handleUpdateItem = async (itemId, updateData) => {
    await ItemEntity.update(itemId, updateData);
    onUpdate();
  };

  const handleAddNewItem = async (sectionKey, newItemData) => {
    const payload = {
      transaction_id: transactionId,
      section: sectionKey,
      ...newItemData
    };
    await ItemEntity.create(payload);
    onUpdate();
  };

  // Handle adding from document library
  const handleAddFromLibrary = async (sectionKey, docData) => {
    const payload = {
      transaction_id: transactionId,
      section: sectionKey,
      document_name: docData.document_name,
      no_seller_buyer: docData.no_seller_buyer || false,
      notes: docData.notes || ''
    };
    await ItemEntity.create(payload);
    onUpdate();
  };

  const handleDeleteItem = async (itemId) => {
    await ItemEntity.delete(itemId);
    onUpdate();
  };
  
  const toggleArchived = (sectionKey) => {
    setShowArchived(prev => ({...prev, [sectionKey]: !prev[sectionKey]}));
  };

  const renderTable = (itemList, sectionKey, includeNewRow = false, isArchived = false) => (
    <div className={`overflow-x-auto rounded-2xl clay-element ${isArchived ? 'border-2 border-gray-300' : ''}`}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 rounded-t-2xl">
          <tr>
            {columns.map((col, index) => (
              <th key={col.key} className={`p-3 text-left font-medium text-gray-700 text-xs ${
                index === 0 ? 'rounded-tl-2xl' : ''
              } ${index === columns.length - 1 ? 'rounded-tr-2xl' : ''}`}>
                {col.title}
                {col.key === 'due_date' && <Calendar className="w-3 h-3 inline ml-1" />}
              </th>
            ))}
            <th className="p-3 w-12 font-medium text-gray-700 text-xs rounded-tr-2xl">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {itemList.map(item => (
            <ItemRow 
              key={item.id} 
              item={item} 
              columns={columns} 
              onUpdate={handleUpdateItem} 
              onDelete={handleDeleteItem} 
            />
          ))}
          {includeNewRow && (
            <ItemRow 
              isNew={true} 
              columns={columns} 
              onAddNew={(newItemData) => handleAddNewItem(sectionKey, newItemData)} 
              sectionKey={sectionKey} 
            />
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card className="clay-element border-0">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="text-sm text-gray-500 flex items-center gap-4">
            <span>{totalPending} pending • {totalCompleted} completed</span>
            {totalOverdue > 0 && (
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                {totalOverdue} overdue
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {sections.map(section => {
          const pending = groupedItems[section.key]?.pending || [];
          const completed = groupedItems[section.key]?.completed || [];
          const isArchivedVisible = showArchived[section.key];

          return (
            <div key={section.key}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg text-gray-800">{section.title}</h3>
                <AddFromMasterList 
                  onAdd={(docData) => handleAddFromLibrary(section.key, docData)}
                  existingItems={[...pending, ...completed]}
                  sectionKey={section.key}
                />
              </div>
              
              {renderTable(pending, section.key, true, false)}

              {completed.length > 0 && (
                <div className="mt-6">
                  <Button 
                    variant="ghost" 
                    onClick={() => toggleArchived(section.key)} 
                    className="text-sm text-gray-600 hover:text-gray-800 mb-3"
                  >
                    {isArchivedVisible ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Hide Archived ({completed.length})
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Show Archived ({completed.length})
                      </>
                    )}
                  </Button>
                  {isArchivedVisible && renderTable(completed, section.key, false, true)}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
