
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { MoreVertical, Save, X, ExternalLink, Percent, DollarSign, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { geocodeAddress } from '@/api/functions';

// --- START: STABLE, DEBOUNCED CURRENCY INPUT ---
const formatCurrency = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const numericValue = parseFloat(String(value).replace(/[^\d.-]/g, ''));
  if (isNaN(numericValue)) return '';
  return `$${numericValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const parseCurrency = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  return String(value).replace(/[^\d.-]/g, '');
};

const CurrencyInput = ({ value, onChange, ...props }) => {
  const [inputValue, setInputValue] = useState(() => formatCurrency(value));
  const debounceTimeout = useRef(null);

  // Effect to sync with external value changes
  useEffect(() => {
    const numericProp = parseCurrency(value);
    const numericState = parseCurrency(inputValue);
    if (numericProp !== numericState) {
        setInputValue(formatCurrency(value));
    }
  }, [value, inputValue]);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    setInputValue(rawValue); // Update display immediately with exactly what the user typed

    // Clear previous debounce timer
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set a new timer to update the parent component's state
    debounceTimeout.current = setTimeout(() => {
      const numericValue = parseCurrency(rawValue);
      onChange(numericValue); // Send clean numeric value to parent
    }, 400); // 400ms delay
  };
  
  const handleBlur = (e) => {
    // On blur, immediately format the display and ensure parent is updated
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    const numericValue = parseCurrency(e.target.value);
    setInputValue(formatCurrency(numericValue));
    onChange(numericValue); // Ensure parent has the final, clean value
  };

  return (
    <Input
      {...props}
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
};
// --- END: STABLE, DEBOUNCED CURRENCY INPUT ---

// --- START: STABLE, DEBOUNCED GENERIC INPUT ---
const DebouncedInput = ({ value, onChange, type = "text", ...props }) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    // Only update localValue if the external value prop has changed AND
    // it's different from the current local value. This prevents resetting
    // the input while the user is typing, but allows external updates.
    if (value !== localValue) {
        setLocalValue(value);
    }
  }, [value, localValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue); // Update local state immediately for responsiveness

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Debounce the call to the parent's onChange handler
    debounceTimeout.current = setTimeout(() => {
      onChange(newValue);
    }, 400); // 400ms debounce
  };
  
  const handleBlur = () => {
    // On blur, ensure any pending debounce call is executed immediately
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null; // Clear timeout reference
    }
    // Also, ensure the parent gets the current local value in case onChange was debounced
    onChange(localValue);
  };

  return <Input {...props} type={type} value={localValue || ''} onChange={handleChange} onBlur={handleBlur} />;
}
// --- END: STABLE, DEBOUNCED GENERIC INPUT ---


export default function TransactionInfo({ transaction, onUpdate, scrollToSalesPrice = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [emdInputType, setEmdInputType] = useState('percentage');
  const [listingCommInputType, setListingCommInputType] = useState('flat');
  const [buyerCommInputType, setBuyerCommInputType] = useState('flat');
  const [geocoding, setGeocoding] = useState(false); // New state for geocoding

  // NEW: Automatically geocode on load if coordinates are missing
  useEffect(() => {
    if (transaction && transaction.property_address && (!transaction.latitude || !transaction.longitude)) {
      const autoGeocodeOnLoad = async () => {
        try {
          const response = await geocodeAddress({ address: transaction.property_address });
          if (response.data.success) {
            const updatePayload = {
              latitude: response.data.latitude,
              longitude: response.data.longitude,
            };
            onUpdate(updatePayload); // Save the new coordinates in the background
          }
        } catch (error) {
          console.error("Automatic background geocoding failed:", error);
        }
      };
      autoGeocodeOnLoad();
    }
  }, [transaction, onUpdate]);

  // Convert transaction data to string format for editing
  useEffect(() => {
    const convertedData = {};
    Object.keys(transaction).forEach(key => {
      if (transaction[key] === null || transaction[key] === undefined) {
        convertedData[key] = '';
      } else {
        convertedData[key] = String(transaction[key]);
      }
    });
    setEditData(convertedData);
    
    // Set input types based on existing data
    if (transaction.emd_percentage !== null && transaction.emd_percentage !== undefined) {
      setEmdInputType('percentage');
    } else if (transaction.emd_amount !== null && transaction.emd_amount !== undefined) {
      setEmdInputType('flat');
    }

    if (transaction.commission_listing_percentage !== null && transaction.commission_listing_percentage !== undefined) {
      setListingCommInputType('percentage');
    } else if (transaction.commission_listing !== null && transaction.commission_listing !== undefined) {
      setListingCommInputType('flat');
    }

    if (transaction.commission_buyer_percentage !== null && transaction.commission_buyer_percentage !== undefined) {
      setBuyerCommInputType('percentage');
    } else if (transaction.commission_buyer !== null && transaction.commission_buyer !== undefined) {
      setBuyerCommInputType('flat');
    }
  }, [transaction]);

  // Handle scrollToSalesPrice prop to auto-edit and focus
  useEffect(() => {
    if (scrollToSalesPrice && !isEditing) {
      setIsEditing(true);
      // Focus the sales price field after a short delay to ensure DOM is ready
      setTimeout(() => {
        const salesPriceInput = document.querySelector('input[data-field="sales_price"]');
        if (salesPriceInput) {
          salesPriceInput.focus();
          salesPriceInput.select();
        }
      }, 100);
    }
  }, [scrollToSalesPrice, isEditing]);

  // Auto-calculate fields when in editing mode
  useEffect(() => {
    if (!isEditing) return;
    
    const salesPrice = parseFloat(editData.sales_price) || 0;
    
    // Auto-calculate EMD
    if (emdInputType === 'percentage' && editData.emd_percentage && salesPrice > 0) {
      const emdPercentage = parseFloat(editData.emd_percentage) || 0;
      const calculatedEMD = (salesPrice * emdPercentage) / 100;
      setEditData(prev => ({ ...prev, emd_amount: calculatedEMD.toString() }));
    } else if (emdInputType === 'flat' && editData.emd_amount === '') {
      // If EMD amount is cleared, ensure percentage is also cleared if applicable
      setEditData(prev => ({ ...prev, emd_percentage: '' }));
    }
    
    // Auto-calculate listing commission
    if (listingCommInputType === 'percentage' && editData.commission_listing_percentage && salesPrice > 0) {
      const commPercentage = parseFloat(editData.commission_listing_percentage) || 0;
      const calculatedComm = (salesPrice * commPercentage) / 100;
      setEditData(prev => ({ ...prev, commission_listing: calculatedComm.toString() }));
    } else if (listingCommInputType === 'flat' && editData.commission_listing === '') {
      setEditData(prev => ({ ...prev, commission_listing_percentage: '' }));
    }
    
    // Auto-calculate buyer commission
    if (buyerCommInputType === 'percentage' && editData.commission_buyer_percentage && salesPrice > 0) {
      const commPercentage = parseFloat(editData.commission_buyer_percentage) || 0;
      const calculatedComm = (salesPrice * commPercentage) / 100;
      setEditData(prev => ({ ...prev, commission_buyer: calculatedComm.toString() }));
    } else if (buyerCommInputType === 'flat' && editData.commission_buyer === '') {
      setEditData(prev => ({ ...prev, commission_buyer_percentage: '' }));
    }
  }, [
    editData.sales_price,
    editData.emd_percentage,
    editData.emd_amount, // Added to trigger recalculation if flat EMD is cleared
    editData.commission_listing_percentage,
    editData.commission_listing, // Added to trigger recalculation if flat commission is cleared
    editData.commission_buyer_percentage,
    editData.commission_buyer, // Added to trigger recalculation if flat commission is cleared
    isEditing,
    emdInputType,
    listingCommInputType,
    buyerCommInputType
  ]);
  
  const handleInputChange = useCallback(async (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    
    // Auto-geocode when property address changes by user
    if (field === 'property_address') {
      if (value && value.length > 10) { // Trigger geocoding for sufficiently long addresses
        setGeocoding(true);
        try {
          const response = await geocodeAddress({ address: value });
          if (response.data.success) {
            setEditData(prev => ({
              ...prev,
              latitude: response.data.latitude.toString(),
              longitude: response.data.longitude.toString()
            }));
          } else {
            // If geocoding was not successful, clear coordinates
            setEditData(prev => ({
              ...prev,
              latitude: '',
              longitude: ''
            }));
          }
        } catch (error) {
          console.error('Geocoding failed:', error);
          // On error, clear coordinates
          setEditData(prev => ({
            ...prev,
            latitude: '',
            longitude: ''
          }));
        } finally {
          setGeocoding(false);
        }
      } else if (!value) { // If address is cleared, clear lat/lng
        setEditData(prev => ({
          ...prev,
          latitude: '',
          longitude: ''
        }));
        setGeocoding(false); // Ensure geocoding spinner stops
      }
    }
  }, []);

  // Convert string values back to proper types for saving
  const prepareDataForSave = useCallback((data) => {
    const cleanedData = {};
    Object.keys(data).forEach(key => {
      const value = data[key];
      
      // List of numeric fields
      const numericFields = [
        'sales_price', 'emd_amount', 'emd_percentage',
        'commission_listing', 'commission_buyer',
        'commission_listing_percentage', 'commission_buyer_percentage',
        'home_warranty_amount', 'property_sf', 'property_lot_sf', 'year_built',
        'latitude', 'longitude'
      ];

      if (numericFields.includes(key)) {
        if (value === '' || value === null || value === undefined) {
          cleanedData[key] = null;
        } else {
          // Ensure we parse the cleaned numeric string
          const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
          cleanedData[key] = isNaN(parsed) ? null : parsed;
        }
      } else {
        cleanedData[key] = value === '' ? null : value;
      }
    });
    return cleanedData;
  }, []);

  const handleSave = useCallback(() => {
    const cleanedData = prepareDataForSave(editData);
    onUpdate(cleanedData);
    setIsEditing(false);
  }, [editData, onUpdate, prepareDataForSave]);
  
  const handleCancel = useCallback(() => {
    const convertedData = {};
    Object.keys(transaction).forEach(key => {
      if (transaction[key] === null || transaction[key] === undefined) {
        convertedData[key] = '';
      } else {
        convertedData[key] = String(transaction[key]);
      }
    });
    setEditData(convertedData);
    setIsEditing(false);
  }, [transaction]);
  
  const InfoItem = ({ label, value, children }) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      {children ? children : <p className="font-semibold mt-1 text-gray-800">{value || 'N/A'}</p>}
    </div>
  );
  
  const EditItem = ({ label, children }) => (
    <div>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );

  return (
    <Card className="clay-element border-0" id="transaction-details">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Transaction Details</CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} className="clay-element border-0">
              <X className="w-4 h-4 mr-1"/> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="clay-element clay-accent-mint border-0">
              <Save className="w-4 h-4 mr-1"/> Save
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="clay-element border-0">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Details
          </Button>
        )}
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
        {!isEditing ? (
          <>
            <InfoItem label="Property Type" value={transaction.property_type?.replace(/_/g, ' ')} />
            <InfoItem label="Agent Side" value={transaction.agent_side?.replace(/_/g, ' ')} />
            <InfoItem label="Escrow #" value={transaction.escrow_number} />
            <InfoItem label="APN #" value={transaction.apn_number} />
            {/* Property Address is now hidden in read-only mode, it's displayed on the main transaction card */}
            <InfoItem label="Sales Price" value={transaction.sales_price ? formatCurrency(transaction.sales_price) : 'N/A'} />
            <InfoItem label="EMD">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800">{transaction.emd_amount ? formatCurrency(transaction.emd_amount) : 'N/A'}</p>
                {transaction.emd_percentage && <p className="text-sm text-gray-500">({transaction.emd_percentage}%)</p>}
              </div>
            </InfoItem>
            <InfoItem label="Commission (Listing)" value={transaction.commission_listing ? formatCurrency(transaction.commission_listing) : 'N/A'} />
            <InfoItem label="Commission (Buyer)" value={transaction.commission_buyer ? formatCurrency(transaction.commission_buyer) : 'N/A'} />
            <InfoItem label="Property SF" value={transaction.property_sf?.toLocaleString() || 'N/A'} />
            <InfoItem label="Lot SF" value={transaction.property_lot_sf?.toLocaleString() || 'N/A'} />
            <InfoItem label="Year Built" value={transaction.year_built || 'N/A'} />
            <InfoItem label="Home Warranty" value={transaction.home_warranty_amount ? formatCurrency(transaction.home_warranty_amount) : 'N/A'} />
            <InfoItem label="Document Storage">
              {transaction.drive_link ? (
                <a href={transaction.drive_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                  Open Drive <ExternalLink className="w-4 h-4"/>
                </a>
              ) : <p className="font-semibold mt-1 text-gray-800">Not Linked</p>}
            </InfoItem>
          </>
        ) : (
          <>
            <EditItem label="Property Type">
              <Select value={editData.property_type || ''} onValueChange={(v) => handleInputChange('property_type', v)}>
                <SelectTrigger className="clay-element border-0 mt-1"><SelectValue/></SelectTrigger>
                <SelectContent className="clay-element border-0">
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condominium">Condominium</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi_2_4">Multi (2-4)</SelectItem>
                  <SelectItem value="multi_5_plus">Multi (5+)</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </EditItem>
            
            <EditItem label="Agent Side">
              <Select value={editData.agent_side || ''} onValueChange={(v) => handleInputChange('agent_side', v)}>
                <SelectTrigger className="clay-element border-0 mt-1"><SelectValue/></SelectTrigger>
                <SelectContent className="clay-element border-0">
                  <SelectItem value="seller_side">Seller Side</SelectItem>
                  <SelectItem value="buyer_side">Buyer Side</SelectItem>
                  <SelectItem value="both_sides">Both Sides</SelectItem>
                  <SelectItem value="landlord_side">Landlord Side</SelectItem>
                  <SelectItem value="tenant_side">Tenant Side</SelectItem>
                </SelectContent>
              </Select>
            </EditItem>
            
            <EditItem label="Escrow #">
              <DebouncedInput 
                value={editData.escrow_number || ''} 
                onChange={(v) => handleInputChange('escrow_number', v)} 
                className="clay-element border-0 mt-1"
              />
            </EditItem>
            
            <EditItem label="APN #">
              <DebouncedInput 
                value={editData.apn_number || ''} 
                onChange={(v) => handleInputChange('apn_number', v)} 
                className="clay-element border-0 mt-1"
              />
            </EditItem>

            {/* Property Address is now shown in edit mode */}
            <div className="col-span-2">
                <EditItem label="Property Address">
                  <div className="relative">
                    <DebouncedInput 
                      value={editData.property_address || ''} 
                      onChange={(v) => handleInputChange('property_address', v)} 
                      className="clay-element border-0 mt-1"
                    />
                    {geocoding && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </EditItem>
            </div>
            
            <EditItem label="Sales Price">
              <CurrencyInput 
                value={editData.sales_price || ''} 
                onChange={(value) => handleInputChange('sales_price', value)} 
                className="clay-element border-0 mt-1"
                data-field="sales_price"
              />
            </EditItem>
            
            <EditItem label="EMD">
              <div className="flex gap-1 mt-1">
                {emdInputType === 'percentage' ? (
                  <DebouncedInput
                    type="number"
                    value={editData.emd_percentage || ''}
                    onChange={(v) => handleInputChange('emd_percentage', v)}
                    className="clay-element border-0"
                    placeholder="%"
                  />
                ) : (
                  <CurrencyInput
                    value={editData.emd_amount || ''}
                    onChange={(value) => handleInputChange('emd_amount', value)}
                    className="clay-element border-0"
                  />
                )}
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="clay-element border-0" 
                  onClick={() => setEmdInputType(p => p === 'percentage' ? 'flat' : 'percentage')}
                >
                  {emdInputType === 'percentage' ? <Percent className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Calculated: {formatCurrency(editData.emd_amount || 0)}</p>
            </EditItem>
            
            <EditItem label="Commission (Listing)">
              <div className="flex gap-1 mt-1">
                {listingCommInputType === 'percentage' ? (
                  <DebouncedInput
                    type="number"
                    value={editData.commission_listing_percentage || ''}
                    onChange={(v) => handleInputChange('commission_listing_percentage', v)}
                    className="clay-element border-0"
                    placeholder="%"
                  />
                ) : (
                  <CurrencyInput
                    value={editData.commission_listing || ''}
                    onChange={(value) => handleInputChange('commission_listing', value)}
                    className="clay-element border-0"
                  />
                )}
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="clay-element border-0" 
                  onClick={() => setListingCommInputType(p => p === 'percentage' ? 'flat' : 'percentage')}
                >
                  {listingCommInputType === 'percentage' ? <Percent className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Calculated: {formatCurrency(editData.commission_listing || 0)}</p>
            </EditItem>
            
            <EditItem label="Commission (Buyer)">
              <div className="flex gap-1 mt-1">
                {buyerCommInputType === 'percentage' ? (
                  <DebouncedInput
                    type="number"
                    value={editData.commission_buyer_percentage || ''}
                    onChange={(v) => handleInputChange('commission_buyer_percentage', v)}
                    className="clay-element border-0"
                    placeholder="%"
                  />
                ) : (
                  <CurrencyInput
                    value={editData.commission_buyer || ''}
                    onChange={(value) => handleInputChange('commission_buyer', value)}
                    className="clay-element border-0"
                  />
                )}
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="clay-element border-0" 
                  onClick={() => setBuyerCommInputType(p => p === 'percentage' ? 'flat' : 'percentage')}
                >
                  {buyerCommInputType === 'percentage' ? <Percent className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Calculated: {formatCurrency(editData.commission_buyer || 0)}</p>
            </EditItem>
            
            <EditItem label="Property SF">
              <DebouncedInput 
                type="number" 
                value={editData.property_sf || ''} 
                onChange={(v) => handleInputChange('property_sf', v)} 
                className="clay-element border-0 mt-1"
              />
            </EditItem>
            
            <EditItem label="Lot SF">
              <DebouncedInput 
                type="number" 
                value={editData.property_lot_sf || ''} 
                onChange={(v) => handleInputChange('property_lot_sf', v)} 
                className="clay-element border-0 mt-1"
              />
            </EditItem>
            
            <EditItem label="Year Built">
              <DebouncedInput 
                type="number" 
                value={editData.year_built || ''} 
                onChange={(v) => handleInputChange('year_built', v)} 
                className="clay-element border-0 mt-1"
              />
            </EditItem>
            
            <EditItem label="Home Warranty">
              <CurrencyInput 
                value={editData.home_warranty_amount || ''} 
                onChange={(value) => handleInputChange('home_warranty_amount', value)} 
                className="clay-element border-0 mt-1"
              />
            </EditItem>
            
            <EditItem label="Drive Link">
              <DebouncedInput 
                value={editData.drive_link || ''} 
                onChange={(v) => handleInputChange('drive_link', v)} 
                className="clay-element border-0 mt-1"
              />
            </EditItem>
          </>
        )}
      </CardContent>
    </Card>
  );
}
