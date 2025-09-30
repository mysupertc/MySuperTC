import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, ChevronsUpDown, Check, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

// This is the master list of addable documents for the dropdown.
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
    { section: "disclosures", document_name: "(BIE) Buyer’s Investigation Elections" },
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

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

function TemplateItemRow({ item, columns, onUpdate, onDelete }) {
  const [localData, setLocalData] = useState(item);
  const isCheckboxUpdating = useRef(false);

  // Update local state if the parent item changes
  useEffect(() => {
    setLocalData(item);
  }, [item]);

  const debouncedUpdate = useMemo(
    () => debounce((updatedData) => onUpdate(item.id, updatedData), 500),
    [item.id, onUpdate]
  );

  const handleFieldChange = (field, value) => {
    const updatedData = { ...localData, [field]: value };
    setLocalData(updatedData);

    if (isCheckboxUpdating.current) {
      onUpdate(item.id, updatedData); // Update immediately for checkboxes
      isCheckboxUpdating.current = false;
    } else {
      debouncedUpdate(updatedData);
    }
  };
  
  const handleCheckboxChange = (field, checked) => {
    isCheckboxUpdating.current = true;
    handleFieldChange(field, checked);
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 last:border-b-0">
      {columns.map(col => (
        <td key={col.key} className="p-2 align-middle">
          {col.type === 'select' ? (
            <Select value={localData[col.key]} onValueChange={(v) => handleFieldChange(col.key, v)}>
              <SelectTrigger className="clay-element border-0 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="clay-element border-0">
                {col.options.map(opt => <SelectItem key={opt} value={opt}>{opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : col.type === 'checkbox' ? (
             <div className="flex justify-center">
                <Checkbox
                    checked={localData[col.key] || false}
                    onCheckedChange={(checked) => handleCheckboxChange(col.key, checked)}
                />
             </div>
          ) : col.type === 'number' ? (
             <Input
              type="number"
              value={localData[col.key] || ''}
              onChange={(e) => handleFieldChange(col.key, parseInt(e.target.value) || 0)}
              className="clay-element border-0 text-sm w-20"
            />
          ) : (
            <Input
              value={localData[col.key] || ''}
              onChange={(e) => handleFieldChange(col.key, e.target.value)}
              className="clay-element border-0 text-sm"
              placeholder={col.key === 'notes' ? 'Add notes...' : ''}
            />
          )}
        </td>
      ))}
      <td className="p-2 align-middle w-12 text-right">
        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  );
}

function AddItemRow({ columns, onAddNew, groupKey, groupValue }) {
    const [newItemData, setNewItemData] = useState({ [groupKey]: groupValue, no_seller_buyer: false });

    const handleNewItemChange = (field, value) => {
        setNewItemData(prev => ({ ...prev, [field]: value }));
    };
    
    const handleAddClick = () => {
        const requiredField = columns.find(c => c.type === 'text')?.key;
        if (!newItemData || !newItemData[requiredField]) return;

        onAddNew(newItemData);
        setNewItemData({ [groupKey]: groupValue, no_seller_buyer: false }); // Reset for next entry
    };

    return (
        <tr className="bg-slate-50">
           {columns.map(col => (
                <td key={col.key} className="p-2 align-middle">
                    {col.type === 'checkbox' ? (
                        <div className="flex justify-center">
                            <Checkbox
                                checked={newItemData[col.key] || false}
                                onCheckedChange={(checked) => handleNewItemChange(col.key, checked)}
                            />
                        </div>
                    ) : (
                        <Input
                            value={newItemData[col.key] || ''}
                            onChange={(e) => handleNewItemChange(col.key, e.target.value)}
                            className="clay-element border-0 text-sm bg-white"
                            placeholder={`Enter ${col.title.toLowerCase()}`}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddClick()}
                        />
                    )}
                </td>
            ))}
            <td className="p-2 align-middle w-12 text-right">
                <Button variant="ghost" size="sm" onClick={handleAddClick} className="text-green-600 hover:bg-green-50 h-8 w-8 p-0" disabled={!newItemData[columns[0].key]}>
                    <Plus className="w-5 h-5"/>
                </Button>
            </td>
        </tr>
    );
}

function AddFromMasterList({ onAdd, existingItems }) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    const availableDocs = useMemo(() => {
        const existingNames = new Set(existingItems.map(item => item.document_name));
        return optionalDocuments.filter(doc => !existingNames.has(doc.document_name));
    }, [existingItems]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="clay-element border-0 justify-between w-[350px]"
                >
                    <span className="truncate">{value ? optionalDocuments.find(doc => doc.document_name === value)?.document_name : "Add from document library..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0">
                <Command>
                    <CommandInput placeholder="Search document..." />
                    <CommandEmpty>No document found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                        {availableDocs.map((doc) => (
                            <CommandItem
                                key={doc.document_name}
                                value={doc.document_name}
                                onSelect={(currentValue) => {
                                    const selectedDoc = optionalDocuments.find(d => d.document_name.toLowerCase() === currentValue.toLowerCase());
                                    if(selectedDoc) {
                                        onAdd(selectedDoc);
                                    }
                                    setValue("");
                                    setOpen(false);
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


export default function TemplateManager({ title, description, ItemEntity, columns, itemKey, enableGrouping = false, groupKey = null, groupOptions = [] }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const data = await ItemEntity.list('order_index'); // Still load all
    setItems(data);
    setLoading(false);
  }, [ItemEntity]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleUpdateItem = async (itemId, updateData) => {
    await ItemEntity.update(itemId, updateData);
    // Optimistic update in UI is handled by local state in ItemRow, reload to be safe
    const updatedItems = items.map(item => item.id === itemId ? { ...item, ...updateData } : item);
    setItems(updatedItems);
  };

  const handleAddNewItem = async (newItemData) => {
    const newItem = await ItemEntity.create(newItemData);
    setItems(prev => [...prev, newItem]);
  };

  const handleDeleteItem = async (itemId) => {
    await ItemEntity.delete(itemId);
    setItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const groupedAndSortedItems = useMemo(() => {
    if (!enableGrouping || !groupKey) return { 'default': [...items].sort((a,b) => (a.document_name || '').localeCompare(b.document_name || '')) };
    
    const grouped = groupOptions.reduce((acc, group) => {
      acc[group.value] = [];
      return acc;
    }, {});
    
    items.forEach(item => {
        if (grouped[item[groupKey]]) {
            grouped[item[groupKey]].push(item);
        }
    });

    // Sort items within each group alphabetically by document_name
    for (const key in grouped) {
        grouped[key].sort((a,b) => (a.document_name || '').localeCompare(b.document_name || ''));
    }
    
    return grouped;
  }, [items, enableGrouping, groupKey, groupOptions]);

  const renderGrouped = () => (
    <div className="space-y-8">
        {groupOptions.map(group => (
            <div key={group.value}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">{group.label}</h3>
                <div className="rounded-2xl clay-element overflow-hidden">
                    <table className="w-full text-sm">
                        <tbody>
                            {(groupedAndSortedItems[group.value] || []).map(item => (
                                <TemplateItemRow
                                    key={item.id}
                                    item={item}
                                    columns={columns}
                                    onUpdate={handleUpdateItem}
                                    onDelete={handleDeleteItem}
                                />
                            ))}
                            <AddItemRow columns={columns} onAddNew={handleAddNewItem} groupKey={groupKey} groupValue={group.value} />
                        </tbody>
                    </table>
                </div>
            </div>
        ))}
    </div>
  );

  const renderUngrouped = () => (
     <div className="overflow-x-auto rounded-2xl clay-element">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {columns.map(col => <th key={col.key} className="p-3 text-left font-medium text-gray-700 text-xs">{col.title}</th>)}
              <th className="p-3 w-12 font-medium text-gray-700 text-xs">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(groupedAndSortedItems['default'] || []).map(item => (
              <TemplateItemRow
                key={item.id}
                item={item}
                columns={columns}
                onUpdate={handleUpdateItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center p-8 text-gray-500">No template items yet. Add one to get started!</p>}
      </div>
  );

  return (
    <Card className="clay-element mt-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {enableGrouping ? (
            <AddFromMasterList onAdd={handleAddNewItem} existingItems={items} />
          ) : (
            <Button onClick={() => handleAddNewItem({})} className="clay-element clay-accent-mint border-0">
                <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
            enableGrouping ? renderGrouped() : renderUngrouped()
        )}
      </CardContent>
    </Card>
  );
}