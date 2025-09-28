
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search, Loader2, Plus, Upload, Building, Percent, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Transaction, Contact, DisclosureTemplate, TaskTemplate, DisclosureItem, TaskItem } from '@/api/entities';
import { fetchMLSData } from '@/api/functions';
import { geocodeAddress } from '@/api/functions';
import { UploadFile } from '@/api/integrations';

import Contacts from '../components/transactions/Contacts';
import DocumentUpload from '../components/transactions/DocumentUpload'; // New import

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
    if (value !== localValue) {
        setLocalValue(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      onChange(newValue);
    }, 400);
  };

  return <Input {...props} type={type} value={localValue || ''} onChange={handleChange} />;
}
// --- END: STABLE, DEBOUNCED GENERIC INPUT ---


export default function NewTransaction() {
  const [mode, setMode] = useState('search'); // 'search', 'off-market', or 'confirm'
  const [mlsNumber, setMlsNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Combined state for all transaction data (property, contract, extracted dates)
  const [newTransaction, setNewTransaction] = useState({
    // Property Information (from MLS or manual)
    ListingKey: '',
    StreetAddress: '',
    Suite: '',
    City: '',
    StateAbbrv: 'CA', // Default state abbreviation
    Zip: '',
    AssessorParcelNumber: '',
    LivingArea: '',
    LotSizeArea: '',
    YearBuilt: '',
    ListPrice: '',
    Beds: '',
    BathsTotal: '',
    ComplexName: '',
    PictureUrl: '',
    County: '',
    PropertySubType: 'single_family', // Default to single_family

    // Contract Details
    agent_side: '',
    status: 'prospecting',
    sales_price: '',
    commission_listing: '',
    commission_listing_percentage: '',
    commission_buyer: '',
    commission_buyer_percentage: '',
    emd_amount: '',
    emd_percentage: '',
    home_warranty_amount: '',
    escrow_number: '',
    original_contract_date: '',
    offer_acceptance_date: '', // New field for DocumentUpload trigger

    // Geocoding
    latitude: null,
    longitude: null,

    // Extracted Document Dates (will be overwritten by handleDocumentDataExtracted)
    investigation_contingency_date: '',
    investigation_contingency_date_status: '',
    loan_contingency_date: '',
    loan_contingency_date_status: '',
    appraisal_contingency_date: '',
    appraisal_contingency_date_status: '',
    seller_disclosures_date: '',
    disclosures_due_back_date: '',
  });

  const [contacts, setContacts] = useState([]);
  const [emdInputType, setEmdInputType] = useState('percentage');
  const [listingCommInputType, setListingCommInputType] = useState('percentage');
  const [buyerCommInputType, setBuyerCommInputType] = useState('percentage');
  const [listingAgents, setListingAgents] = useState([]);
  const [geocoding, setGeocoding] = useState(false); // New state for geocoding
  const [extractedDocumentData, setExtractedDocumentData] = useState(null); // New state for document data

  // Smart property type matching function
  const getMatchingPropertyType = (mlsPropertyType) => {
    if (!mlsPropertyType) return 'single_family';
    
    const type = mlsPropertyType.toLowerCase();
    
    // Direct matches
    if (type.includes('single family') || type.includes('sfr') || type.includes('detached')) return 'single_family';
    if (type.includes('condo') || type.includes('condominium')) return 'condominium';
    if (type.includes('townhouse') || type.includes('town house') || type.includes('attached')) return 'townhouse';
    if (type.includes('multi') && (type.includes('2-4') || type.includes('2 to 4') || type.includes('duplex') || type.includes('triplex') || type.includes('fourplex'))) return 'multi_2_4';
    if (type.includes('multi') && (type.includes('5+') || type.includes('5 or more') || type.includes('apartment'))) return 'multi_5_plus';
    if (type.includes('commercial') || type.includes('office') || type.includes('retail')) return 'commercial';
    
    // Default fallback
    return 'single_family';
  };

  const searchMLS = async () => {
    if (!mlsNumber.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetchMLSData({ mlsNumber: mlsNumber.trim() });
      
      if (response.data.success) {
        const data = response.data.data;
        const matchedPropertyType = getMatchingPropertyType(data.PropertySubType);
        
        // Attempt initial geocoding for MLS properties
        const fullAddress = [data.StreetAddress, data.City, data.StateAbbrv, data.Zip].filter(Boolean).join(', ');
        let geoLat = null;
        let geoLong = null;

        if (fullAddress.length > 10) {
          setGeocoding(true);
          try {
            const geoResponse = await geocodeAddress({ address: fullAddress });
            if (geoResponse.data.success) {
              geoLat = geoResponse.data.latitude;
              geoLong = geoResponse.data.longitude;
            }
          } catch (geoError) {
            console.error('Initial geocoding for MLS data failed:', geoError);
          } finally {
            setGeocoding(false);
          }
        }
        
        setNewTransaction(prev => ({
          ...prev,
          ListingKey: data.ListingKey || '',
          StreetAddress: data.StreetAddress || '',
          Suite: data.Suite || '',
          City: data.City || '',
          StateAbbrv: data.StateAbbrv || 'CA',
          Zip: data.Zip || '',
          AssessorParcelNumber: data.AssessorParcelNumber || '',
          LivingArea: data.LivingArea || '',
          LotSizeArea: data.LotSizeArea || '',
          YearBuilt: data.YearBuilt || '',
          ListPrice: data.ListPrice || '',
          Beds: data.Beds || '',
          BathsTotal: data.BathsTotal || '',
          ComplexName: data.ComplexName || '',
          PictureUrl: data.PictureUrl || '',
          County: data.County || '',
          PropertySubType: matchedPropertyType,
          latitude: geoLat,
          longitude: geoLong,
        }));
        
        // Auto-populate listing agent contacts
        const agents = [];
        
        // Main Listing Agent
        if (data.ListAgentFirstName && data.ListAgentLastName) {
          const listingAgentName = `${data.ListAgentFirstName} ${data.ListAgentLastName}`.trim();
          const listingAgentAddressParts = [
            data.ListAgentAddress1,
            data.ListAgentCity,
            data.ListAgentState,
            data.ListAgentZip
          ].filter(Boolean);
          const listingAgentAddress = listingAgentAddressParts.length > 0 ? listingAgentAddressParts.join(', ') : '';
          
          const listingOfficeAddressParts = [
            data.ListOfficeAddress1,
            data.ListOfficeCity,
            data.ListOfficeState,
            data.ListOfficeZip
          ].filter(Boolean);
          const listingOfficeAddress = listingOfficeAddressParts.length > 0 ? listingOfficeAddressParts.join(', ') : '';

          agents.push({
            id: `listing-agent-${data.ListAgentLicenseNumber || listingAgentName.replace(/\s+/g, '-')}`,
            type: 'listing_agent',
            name: listingAgentName,
            dre_number: data.ListAgentLicenseNumber,
            email: data.ListAgentEmail,
            cell_phone: data.ListAgentCell,
            address: listingAgentAddress,
            brokerage_name: data.ListOfficeName,
            brokerage_dre: data.ListOfficeLicenseNumber,
            brokerage_phone: data.ListOfficePhone,
            brokerage_address: listingOfficeAddress,
          });
        }
        
        // Co-Listing Agent
        if (data.CoListAgentFirstName && data.CoListAgentLastName) {
          const coListingAgentName = `${data.CoListAgentFirstName} ${data.CoListAgentLastName}`.trim();
          const coListingAgentAddressParts = [
            data.CoListAgentAddress1,
            data.CoListAgentCity,
            data.CoListAgentState,
            data.CoListAgentZip
          ].filter(Boolean);
          const coListingAgentAddress = coListingAgentAddressParts.length > 0 ? coListingAgentAddressParts.join(', ') : '';
          
          const coListingOfficeAddressParts = [
            data.CoListOfficeAddress1,
            data.CoListOfficeCity,
            data.CoListOfficeState,
            data.CoListOfficeZip
          ].filter(Boolean);
          const coListingOfficeAddress = coListingOfficeAddressParts.length > 0 ? coListingOfficeAddressParts.join(', ') : '';

          agents.push({
            id: `co-listing-agent-${data.CoListAgentLicenseNumber || coListingAgentName.replace(/\s+/g, '-')}`,
            type: 'co_listing_agent',
            name: coListingAgentName,
            dre_number: data.CoListAgentLicenseNumber,
            email: data.CoListAgentEmail,
            cell_phone: data.CoListAgentCell,
            address: coListingAgentAddress,
            brokerage_name: data.CoListOfficeName,
            brokerage_dre: data.CoListOfficeLicenseNumber,
            brokerage_phone: data.CoListOfficePhone,
            brokerage_address: coListingOfficeAddress,
          });
        }
        
        setListingAgents(agents);
        setMode('confirm');
      } else {
        setError(response.data.error || 'No property found with this MLS number');
      }
    } catch (err) {
      setError(`Error fetching property data: ${err.message}`);
      console.error('MLS Data Processing Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOffMarketMode = () => {
    setNewTransaction(prev => ({
      ...prev,
      // Reset property-specific fields
      ListingKey: '',
      StreetAddress: '',
      Suite: '',
      City: '',
      StateAbbrv: 'CA',
      Zip: '',
      AssessorParcelNumber: '',
      LivingArea: '',
      LotSizeArea: '',
      YearBuilt: '',
      ListPrice: '',
      Beds: '',
      BathsTotal: '',
      ComplexName: '',
      PictureUrl: '',
      County: '',
      PropertySubType: getMatchingPropertyType(null), // Default
      latitude: null,
      longitude: null,
    }));
    setMode('confirm');
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const uploadResponse = await UploadFile({ file });
      setNewTransaction(prev => ({ ...prev, PictureUrl: uploadResponse.file_url }));
    } catch (error) {
      setError('Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  // For general property data and other non-calculating fields
  const handleTransactionPropertyChange = async (field, value) => {
    setNewTransaction(prev => ({ ...prev, [field]: value }));
    
    // Auto-geocode when address-related fields change
    if (['StreetAddress', 'City', 'StateAbbrv', 'Zip'].includes(field)) {
      const updatedDataForGeocode = { ...newTransaction, [field]: value }; // Use updated value for current field
      const fullAddress = [
        updatedDataForGeocode.StreetAddress,
        updatedDataForGeocode.City,
        updatedDataForGeocode.StateAbbrv,
        updatedDataForGeocode.Zip
      ].filter(Boolean).join(', ');
      
      if (fullAddress.length > 10) { // Only geocode if we have a reasonable address
        setGeocoding(true);
        try {
          const response = await geocodeAddress({ address: fullAddress });
          if (response.data.success) {
            setNewTransaction(prev => ({
              ...prev,
              latitude: response.data.latitude,
              longitude: response.data.longitude
            }));
          } else {
            setNewTransaction(prev => ({
              ...prev,
              latitude: null,
              longitude: null
            }));
          }
        } catch (error) {
          console.error('Geocoding failed:', error);
          setNewTransaction(prev => ({
            ...prev,
            latitude: null,
            longitude: null
          }));
        } finally {
          setGeocoding(false);
        }
      } else {
        setNewTransaction(prev => ({
          ...prev,
          latitude: null,
          longitude: null
        }));
      }
    }
  };

  // For contract data that involves calculations (emd, commission) or specific contract fields
  const handleContractDataChange = (field, value) => {
    setNewTransaction(prev => {
      let updatedData = { ...prev, [field]: value };
      const salesPrice = parseFloat(parseCurrency(updatedData.sales_price)) || 0;

      // Handle EMD
      if (field === 'emd_percentage') {
        if (salesPrice > 0 && parseFloat(value) >= 0) {
          updatedData.emd_amount = ((salesPrice * parseFloat(value)) / 100).toString();
        } else {
          updatedData.emd_amount = '';
        }
      } else if (field === 'emd_amount') {
        if (salesPrice > 0 && parseFloat(parseCurrency(value)) >= 0) {
          updatedData.emd_percentage = ((parseFloat(parseCurrency(value)) / salesPrice) * 100).toString();
        } else {
          updatedData.emd_percentage = '';
        }
      }
      
      // Handle Listing Commission
      if (field === 'commission_listing_percentage') {
        if (salesPrice > 0 && parseFloat(value) >= 0) {
          updatedData.commission_listing = ((salesPrice * parseFloat(value)) / 100).toString();
        } else {
          updatedData.commission_listing = '';
        }
      } else if (field === 'commission_listing') {
        if (salesPrice > 0 && parseFloat(parseCurrency(value)) >= 0) {
          updatedData.commission_listing_percentage = ((parseFloat(parseCurrency(value)) / salesPrice) * 100).toString();
        } else {
          updatedData.commission_listing_percentage = '';
        }
      }
      
      // Handle Buyer Commission
      if (field === 'commission_buyer_percentage') {
        if (salesPrice > 0 && parseFloat(value) >= 0) {
          updatedData.commission_buyer = ((salesPrice * parseFloat(value)) / 100).toString();
        } else {
          updatedData.commission_buyer = '';
        }
      } else if (field === 'commission_buyer') {
        if (salesPrice > 0 && parseFloat(parseCurrency(value)) >= 0) {
          updatedData.commission_buyer_percentage = ((parseFloat(parseCurrency(value)) / salesPrice) * 100).toString();
        } else {
          updatedData.commission_buyer_percentage = '';
        }
      }

      // If sales_price changes, re-calculate all amounts based on current percentages
      if (field === 'sales_price') {
        if (salesPrice > 0) {
          if (updatedData.emd_percentage) updatedData.emd_amount = ((salesPrice * parseFloat(updatedData.emd_percentage || 0)) / 100).toString();
          if (updatedData.commission_listing_percentage) updatedData.commission_listing = ((salesPrice * parseFloat(updatedData.commission_listing_percentage || 0)) / 100).toString();
          if (updatedData.commission_buyer_percentage) updatedData.commission_buyer = ((salesPrice * parseFloat(updatedData.commission_buyer_percentage || 0)) / 100).toString();
        } else {
          // If sales price is 0 or empty, clear calculated amounts
          if (updatedData.emd_percentage) updatedData.emd_amount = '';
          if (updatedData.commission_listing_percentage) updatedData.commission_listing = '';
          if (updatedData.commission_buyer_percentage) updatedData.commission_buyer = '';
        }
      }
      
      return updatedData;
    });
  };

  const formatAddress = (data) => {
    const parts = [
      data.StreetAddress,
      data.Suite && `#${data.Suite}`,
      data.City,
      data.StateAbbrv,
      data.Zip
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleDocumentDataExtracted = (data) => {
    setExtractedDocumentData(data);
    
    setNewTransaction(prev => {
      const updatedTransaction = { ...prev };
      
      // Map extracted data to transaction fields
      if (data.sales_price) updatedTransaction.sales_price = data.sales_price;
      if (data.emd_amount) updatedTransaction.emd_amount = data.emd_amount;
      if (data.emd_percentage) updatedTransaction.emd_percentage = data.emd_percentage;
      if (data.buyer_commission_amount) updatedTransaction.commission_buyer = data.buyer_commission_amount;
      if (data.buyer_commission_percentage) updatedTransaction.commission_buyer_percentage = data.buyer_commission_percentage;
      if (data.home_warranty_amount) updatedTransaction.home_warranty_amount = data.home_warranty_amount;
      if (data.offer_acceptance_date) updatedTransaction.offer_acceptance_date = data.offer_acceptance_date; // Also apply offer_acceptance_date if extracted
      
      // Important dates
      if (data.investigation_contingency_date) {
        updatedTransaction.investigation_contingency_date = data.investigation_contingency_date;
        if (data.investigation_contingency_date_status) {
          updatedTransaction.investigation_contingency_date_status = data.investigation_contingency_date_status;
        }
      }
      if (data.loan_contingency_date) {
        updatedTransaction.loan_contingency_date = data.loan_contingency_date;
        if (data.loan_contingency_date_status) {
          updatedTransaction.loan_contingency_date_status = data.loan_contingency_date_status;
        }
      }
      if (data.appraisal_contingency_date) {
        updatedTransaction.appraisal_contingency_date = data.appraisal_contingency_date;
        if (data.appraisal_contingency_date_status) {
          updatedTransaction.appraisal_contingency_date_status = data.appraisal_contingency_date_status;
        }
      }
      if (data.seller_disclosures_delivery_date) {
        updatedTransaction.seller_disclosures_date = data.seller_disclosures_delivery_date;
      }
      if (data.disclosures_due_back_date) {
        updatedTransaction.disclosures_due_back_date = data.disclosures_due_back_date;
      }
      
      return updatedTransaction;
    });
  };

  const handleCreateTransaction = async () => {
    // Validation
    if (!newTransaction.agent_side) {
      setError('Please select your representing side');
      return;
    }
    if (!newTransaction.status) {
      setError('Please select property status');
      return;
    }

    try {
      // Helper function to clean numeric values
      const cleanNumericValue = (value) => {
        if (value === '' || value === null || value === undefined) return null;
        const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? null : parsed;
      };

      // Ensure we have coordinates - if not, try to geocode the address one final time
      let finalLatitude = newTransaction.latitude;
      let finalLongitude = newTransaction.longitude;
      
      if (!finalLatitude || !finalLongitude) {
        const fullAddress = formatAddress(newTransaction);
        if (fullAddress && fullAddress.length > 10) {
          setGeocoding(true);
          try {
            const response = await geocodeAddress({ address: fullAddress });
            if (response.data.success) {
              finalLatitude = response.data.latitude;
              finalLongitude = response.data.longitude;
            }
          } catch (error) {
            console.error('Final geocoding attempt failed:', error);
          } finally {
            setGeocoding(false);
          }
        }
      }

      const transactionData = {
        property_address: formatAddress(newTransaction),
        mls_number: newTransaction.ListingKey,
        apn_number: newTransaction.AssessorParcelNumber,
        property_type: newTransaction.PropertySubType || 'single_family',
        year_built: cleanNumericValue(newTransaction.YearBuilt),
        property_sf: cleanNumericValue(newTransaction.LivingArea),
        property_lot_sf: cleanNumericValue(newTransaction.LotSizeArea),
        property_image_url: newTransaction.PictureUrl,
        latitude: finalLatitude,
        longitude: finalLongitude,
        
        // Contract Data
        agent_side: newTransaction.agent_side,
        status: newTransaction.status,
        sales_price: cleanNumericValue(newTransaction.sales_price),
        commission_listing: cleanNumericValue(newTransaction.commission_listing),
        commission_listing_percentage: cleanNumericValue(newTransaction.commission_listing_percentage),
        commission_buyer: cleanNumericValue(newTransaction.commission_buyer),
        commission_buyer_percentage: cleanNumericValue(newTransaction.commission_buyer_percentage),
        emd_amount: cleanNumericValue(newTransaction.emd_amount),
        emd_percentage: cleanNumericValue(newTransaction.emd_percentage),
        home_warranty_amount: cleanNumericValue(newTransaction.home_warranty_amount),
        escrow_number: newTransaction.escrow_number,
        original_contract_date: newTransaction.original_contract_date,
        offer_acceptance_date: newTransaction.offer_acceptance_date,
        
        // Extracted Dates
        investigation_contingency_date: newTransaction.investigation_contingency_date,
        investigation_contingency_date_status: newTransaction.investigation_contingency_date_status,
        loan_contingency_date: newTransaction.loan_contingency_date,
        loan_contingency_date_status: newTransaction.loan_contingency_date_status,
        appraisal_contingency_date: newTransaction.appraisal_contingency_date,
        appraisal_contingency_date_status: newTransaction.appraisal_contingency_date_status,
        seller_disclosures_date: newTransaction.seller_disclosures_date,
        disclosures_due_back_date: newTransaction.disclosures_due_back_date,
      };

      const createdTransaction = await Transaction.create(transactionData);
      
      // Auto-populate checklists from templates with conditional logic
      const disclosureTemplates = await DisclosureTemplate.list();
      if (disclosureTemplates.length > 0) {
        const filteredTemplates = disclosureTemplates.filter(template => {
          // If no conditions, always include it.
          if (!template.property_type_conditions || template.property_type_conditions.length === 0) {
            return true;
          }
          // Otherwise, check if the transaction's property type is in the condition list.
          return template.property_type_conditions.includes(createdTransaction.property_type);
        });

        const newDisclosureItems = filteredTemplates.map(template => ({
          transaction_id: createdTransaction.id,
          section: template.section,
          document_name: template.document_name,
          order_index: template.order_index,
          notes: template.notes,
          no_seller_buyer: template.no_seller_buyer,
        }));
        await DisclosureItem.bulkCreate(newDisclosureItems);
      }

      const taskTemplates = await TaskTemplate.list();
      if (taskTemplates.length > 0) {
        const newTaskItems = taskTemplates.map(template => ({
          transaction_id: createdTransaction.id,
          section: template.section,
          task_name: template.task_name,
          order_index: template.order_index,
        }));
        await TaskItem.bulkCreate(newTaskItems);
      }
      
      // Create associated contacts (avoiding duplicates)
      const allContactsToCreate = [...contacts]; // Start with manually added contacts
      
      // Add listing agent contacts automatically from MLS data
      for (const agent of listingAgents) {
        // Check for duplicate agent by email or DRE number
        const isAgentDuplicate = allContactsToCreate.some(c => 
          (c.email && agent.email && c.email.toLowerCase() === agent.email.toLowerCase()) ||
          (c.dre_number && agent.dre_number && c.dre_number.toLowerCase() === agent.dre_number.toLowerCase())
        );
        
        if (!isAgentDuplicate) {
          allContactsToCreate.push({
            contact_type: 'seller_agent', // Both listing and co-listing agents are 'seller_agent' for now
            name: agent.name,
            dre_number: agent.dre_number,
            email: agent.email,
            cell_phone: agent.cell_phone,
            address: agent.address,
            notes: agent.type === 'co_listing_agent' ? 'Co-Listing Agent (Auto-populated from MLS)' : 'Listing Agent (Auto-populated from MLS)',
            source_mls_id: agent.id // Store the generated ID for tracking
          });
        }
          
        // Add brokerage contact if available and not a duplicate
        if (agent.brokerage_name) {
          const isBrokerageDuplicate = allContactsToCreate.some(c => 
            c.name && agent.brokerage_name && c.name.toLowerCase() === agent.brokerage_name.toLowerCase() &&
            c.contact_type === 'seller_brokerage' // Ensure we're comparing similar types
          );
          
          if (!isBrokerageDuplicate) {
            allContactsToCreate.push({
              contact_type: 'seller_brokerage',
              name: agent.brokerage_name,
              dre_number: agent.brokerage_dre, // Brokerage DRE number
              office_phone: agent.brokerage_phone, // Use office_phone for brokerage
              address: agent.brokerage_address,
              notes: agent.type === 'co_listing_agent' ? 'Co-Listing Brokerage (Auto-populated from MLS)' : 'Listing Brokerage (Auto-populated from MLS)',
              source_mls_id: `${agent.id}-brokerage`
            });
          }
        }
      }
      
      // Now, iterate through allContactsToCreate and save them
      for (const contact of allContactsToCreate) {
        await Contact.create({
          ...contact,
          transaction_id: createdTransaction.id
        });
      }
      
      // Redirect to the transaction detail page
      window.location.href = createPageUrl("TransactionDetail", `id=${createdTransaction.id}`);
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError('Error creating transaction. Please try again.');
    }
  };

  if (mode === 'search') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("Transactions")}>
            <Button variant="outline" size="icon" className="bg-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Transaction</h1>
            <p className="text-gray-600">Choose how to add your property</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="clay-element border-0">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <Search className="w-6 h-6 text-indigo-600" />
                MLS Property Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>MLS Number</Label>
                <Input
                  placeholder="Enter MLS number (e.g., 25589821)"
                  value={mlsNumber}
                  onChange={(e) => setMlsNumber(e.target.value)}
                  className="clay-element border-0"
                  onKeyPress={(e) => e.key === 'Enter' && searchMLS()}
                />
              </div>
              
              <Button 
                onClick={searchMLS} 
                disabled={loading || !mlsNumber.trim()}
                className="clay-accent-blue w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching Property...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search Property
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="clay-element border-0">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3">
                <Building className="w-6 h-6 text-purple-600" />
                Off-Market Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Add property details manually for off-market or pocket listings.</p>
              
              <Button 
                onClick={handleOffMarketMode}
                className="clay-accent-mint w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Off-Market Property
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'confirm') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => setMode('search')} className="clay-element border-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Review Property Details</h1>
            <p className="text-gray-600">Confirm and edit the information before creating your transaction</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Property Photo */}
          <div className="lg:col-span-1">
            <Card className="clay-element border-0">
              <CardContent className="p-0">
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  <img 
                    src={newTransaction.PictureUrl || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=600'} 
                    alt="Property"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button variant="outline" size="sm" className="clay-element border-0 bg-white/90">
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Listing Agents Information */}
            {listingAgents.length > 0 && (
              <div className="space-y-4 mt-6">
                {listingAgents.map(agent => (
                  <Card key={agent.id} className="clay-element border-0">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        {agent.type === 'co_listing_agent' ? 'Co-Listing Agent' : 'Listing Agent'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{agent.name}</p>
                        {agent.dre_number && <p className="text-gray-600">DRE# {agent.dre_number}</p>}
                      </div>
                      
                      {agent.email && (
                        <div>
                          <p className="text-gray-500">Email</p>
                          <p className="text-gray-900">{agent.email}</p>
                        </div>
                      )}
                      
                      {agent.cell_phone && (
                        <div>
                          <p className="text-gray-500">Cell Phone</p>
                          <p className="text-gray-900">{agent.cell_phone}</p>
                        </div>
                      )}
                      
                      {agent.address && (
                        <div>
                          <p className="text-gray-500">Address</p>
                          <p className="text-gray-900">{agent.address}</p>
                        </div>
                      )}
                      
                      {agent.brokerage_name && (
                        <div className="border-t pt-3 mt-3">
                          <p className="font-semibold text-gray-900">{agent.brokerage_name}</p>
                          {agent.brokerage_dre && <p className="text-gray-600">DRE# {agent.brokerage_dre}</p>}
                          {agent.brokerage_phone && <p className="text-gray-600">{agent.brokerage_phone}</p>}
                          {agent.brokerage_address && <p className="text-gray-600">{agent.brokerage_address}</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Property Details and Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Information */}
            <Card className="clay-element border-0">
              <CardHeader>
                <CardTitle className="text-xl">Property Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Street Address</Label>
                  <div className="relative">
                    <DebouncedInput 
                      value={newTransaction.StreetAddress} 
                      onChange={(v) => handleTransactionPropertyChange('StreetAddress', v)}
                      className="clay-element border-0 mt-1"
                    />
                    {geocoding && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Suite/Unit</Label>
                  <DebouncedInput 
                    value={newTransaction.Suite} 
                    onChange={(v) => handleTransactionPropertyChange('Suite', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <DebouncedInput 
                    value={newTransaction.City} 
                    onChange={(v) => handleTransactionPropertyChange('City', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <DebouncedInput 
                    value={newTransaction.StateAbbrv} 
                    onChange={(v) => handleTransactionPropertyChange('StateAbbrv', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Zip Code</Label>
                  <DebouncedInput 
                    value={newTransaction.Zip} 
                    onChange={(v) => handleTransactionPropertyChange('Zip', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>MLS Number</Label>
                  <DebouncedInput 
                    value={newTransaction.ListingKey} 
                    onChange={(v) => handleTransactionPropertyChange('ListingKey', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Property Type</Label>
                  <Select 
                    value={newTransaction.PropertySubType || ''} 
                    onValueChange={(value) => handleTransactionPropertyChange('PropertySubType', value)}
                  >
                    <SelectTrigger className="clay-element border-0 mt-1">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent className="clay-element border-0">
                      <SelectItem value="single_family">Single Family</SelectItem>
                      <SelectItem value="condominium">Condominium</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="multi_2_4">Multi-Family (2-4 Units)</SelectItem>
                      <SelectItem value="multi_5_plus">Multi-Family (5+ Units)</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>APN</Label>
                  <DebouncedInput 
                    value={newTransaction.AssessorParcelNumber} 
                    onChange={(v) => handleTransactionPropertyChange('AssessorParcelNumber', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Year Built</Label>
                  <DebouncedInput 
                    type="number"
                    value={newTransaction.YearBuilt} 
                    onChange={(v) => handleTransactionPropertyChange('YearBuilt', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Living Area (SF)</Label>
                  <DebouncedInput 
                    type="number"
                    value={newTransaction.LivingArea} 
                    onChange={(v) => handleTransactionPropertyChange('LivingArea', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Lot Size (SF)</Label>
                  <DebouncedInput 
                    type="number"
                    value={newTransaction.LotSizeArea} 
                    onChange={(v) => handleTransactionPropertyChange('LotSizeArea', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Bedrooms</Label>
                  <DebouncedInput 
                    type="number"
                    value={newTransaction.Beds} 
                    onChange={(v) => handleTransactionPropertyChange('Beds', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <DebouncedInput 
                    type="number"
                    value={newTransaction.BathsTotal} 
                    onChange={(v) => handleTransactionPropertyChange('BathsTotal', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
                <div>
                  <Label>County</Label>
                  <DebouncedInput 
                    value={newTransaction.County} 
                    onChange={(v) => handleTransactionPropertyChange('County', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contract Details */}
            <Card className="clay-element border-0">
              <CardHeader>
                <CardTitle className="text-xl">Contract Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Representing Side *</Label>
                  <Select 
                    value={newTransaction.agent_side} 
                    onValueChange={(value) => handleContractDataChange('agent_side', value)}
                  >
                    <SelectTrigger className="clay-element border-0 mt-1">
                      <SelectValue placeholder="Select your side" />
                    </SelectTrigger>
                    <SelectContent className="clay-element border-0">
                      <SelectItem value="seller_side">Seller Side</SelectItem>
                      <SelectItem value="buyer_side">Buyer Side</SelectItem>
                      <SelectItem value="both_sides">Both Sides</SelectItem>
                      <SelectItem value="landlord_side">Landlord Side</SelectItem>
                      <SelectItem value="tenant_side">Tenant Side</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Property Status *</Label>
                  <Select 
                    value={newTransaction.status} 
                    onValueChange={(value) => handleContractDataChange('status', value)}
                  >
                    <SelectTrigger className="clay-element border-0 mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="clay-element border-0">
                      <SelectItem value="prospecting">Prospecting</SelectItem>
                      <SelectItem value="active_contingent">Active (Contingent)</SelectItem>
                      <SelectItem value="active_noncontingent">Active (Non-contingent)</SelectItem>
                      <SelectItem value="pre_listing">Pre-Listing</SelectItem>
                      <SelectItem value="listed">Listed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Sale Price</Label>
                  <CurrencyInput 
                    placeholder="$0"
                    value={newTransaction.sales_price}
                    onChange={(value) => handleContractDataChange('sales_price', value)}
                    className="clay-element border-0 mt-1"
                  />
                </div>

                <div>
                  <Label>Original Contract Date</Label>
                  <DebouncedInput 
                    type="date"
                    value={newTransaction.original_contract_date}
                    onChange={(v) => handleTransactionPropertyChange('original_contract_date', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>

                <div>
                  <Label>Offer Acceptance Date</Label>
                  <DebouncedInput
                    type="date"
                    value={newTransaction.offer_acceptance_date}
                    onChange={(v) => handleTransactionPropertyChange('offer_acceptance_date', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>

                <div>
                  <Label>EMD</Label>
                  <div className="flex gap-1 mt-1">
                    {emdInputType === 'percentage' ? (
                      <DebouncedInput
                        type="number"
                        placeholder="%"
                        value={newTransaction.emd_percentage}
                        onChange={(v) => handleContractDataChange('emd_percentage', v)}
                        className="clay-element border-0"
                      />
                    ) : (
                      <CurrencyInput
                        placeholder="$0"
                        value={newTransaction.emd_amount}
                        onChange={(value) => handleContractDataChange('emd_amount', value)}
                        className="clay-element border-0"
                      />
                    )}
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="outline" 
                      className="clay-element border-0" 
                      onClick={() => setEmdInputType(p => p === 'percentage' ? 'flat' : 'percentage')}
                    >
                      {emdInputType === 'percentage' ? <Percent className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                    </Button>
                  </div>
                  {newTransaction.sales_price && newTransaction.emd_amount !== '' && (
                    <p className="text-sm text-gray-600 mt-1">Amount: {formatCurrency(newTransaction.emd_amount)}</p>
                  )}
                </div>

                <div>
                  <Label>Listing Commission</Label>
                  <div className="flex gap-1 mt-1">
                    {listingCommInputType === 'percentage' ? (
                      <DebouncedInput
                        type="number"
                        placeholder="%"
                        value={newTransaction.commission_listing_percentage}
                        onChange={(v) => handleContractDataChange('commission_listing_percentage', v)}
                        className="clay-element border-0"
                      />
                    ) : (
                      <CurrencyInput
                        placeholder="$0"
                        value={newTransaction.commission_listing}
                        onChange={(value) => handleContractDataChange('commission_listing', value)}
                        className="clay-element border-0"
                      />
                    )}
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="outline" 
                      className="clay-element border-0" 
                      onClick={() => setListingCommInputType(p => p === 'percentage' ? 'flat' : 'percentage')}
                    >
                      {listingCommInputType === 'percentage' ? <Percent className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                    </Button>
                  </div>
                  {newTransaction.sales_price && newTransaction.commission_listing !== '' && (
                    <p className="text-sm text-gray-600 mt-1">Amount: {formatCurrency(newTransaction.commission_listing)}</p>
                  )}
                </div>

                <div>
                  <Label>Buyer Commission</Label>
                  <div className="flex gap-1 mt-1">
                    {buyerCommInputType === 'percentage' ? (
                      <DebouncedInput
                        type="number"
                        placeholder="%"
                        value={newTransaction.commission_buyer_percentage}
                        onChange={(v) => handleContractDataChange('commission_buyer_percentage', v)}
                        className="clay-element border-0"
                      />
                    ) : (
                      <CurrencyInput
                        placeholder="$0"
                        value={newTransaction.commission_buyer}
                        onChange={(value) => handleContractDataChange('commission_buyer', value)}
                        className="clay-element border-0"
                      />
                    )}
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="outline" 
                      className="clay-element border-0" 
                      onClick={() => setBuyerCommInputType(p => p === 'percentage' ? 'flat' : 'percentage')}
                    >
                      {buyerCommInputType === 'percentage' ? <Percent className="w-4 h-4"/> : <DollarSign className="w-4 h-4"/>}
                    </Button>
                  </div>
                  {newTransaction.sales_price && newTransaction.commission_buyer !== '' && (
                    <p className="text-sm text-gray-600 mt-1">Amount: {formatCurrency(newTransaction.commission_buyer)}</p>
                  )}
                </div>

                <div>
                  <Label>Home Warranty</Label>
                  <CurrencyInput 
                    placeholder="$0"
                    value={newTransaction.home_warranty_amount}
                    onChange={(value) => handleContractDataChange('home_warranty_amount', value)}
                    className="clay-element border-0 mt-1"
                  />
                </div>

                <div>
                  <Label>Escrow Number</Label>
                  <DebouncedInput 
                    placeholder="Escrow reference number"
                    value={newTransaction.escrow_number}
                    onChange={(v) => handleTransactionPropertyChange('escrow_number', v)}
                    className="clay-element border-0 mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Upload Section */}
            {newTransaction.offer_acceptance_date && (
              <Card className="clay-element border-0">
                <CardHeader>
                  <CardTitle className="text-xl">Upload Contract for Data Extraction</CardTitle>
                  <p className="text-gray-600 text-sm">Upload your signed purchase agreement to automatically extract important dates and financial terms.</p>
                </CardHeader>
                <CardContent>
                  <DocumentUpload 
                    onDataExtracted={handleDocumentDataExtracted}
                    offerAcceptanceDate={newTransaction.offer_acceptance_date}
                  />
                </CardContent>
              </Card>
            )}

            {/* Display Extracted Dates (Editable Inputs) */}
            {(newTransaction.investigation_contingency_date || newTransaction.loan_contingency_date || newTransaction.appraisal_contingency_date || newTransaction.seller_disclosures_date || newTransaction.disclosures_due_back_date) && (
              <Card className="clay-element border-0">
                <CardHeader>
                  <CardTitle className="text-xl">Key Dates (Extracted/Editable)</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newTransaction.investigation_contingency_date && (
                    <div>
                      <Label>Investigation Contingency Date</Label>
                      <DebouncedInput
                        type="date"
                        value={newTransaction.investigation_contingency_date}
                        onChange={(v) => handleTransactionPropertyChange('investigation_contingency_date', v)}
                        className="clay-element border-0 mt-1"
                      />
                      {newTransaction.investigation_contingency_date_status && (
                        <p className="text-sm text-gray-600 mt-1">Status: {newTransaction.investigation_contingency_date_status}</p>
                      )}
                    </div>
                  )}
                  {newTransaction.loan_contingency_date && (
                    <div>
                      <Label>Loan Contingency Date</Label>
                      <DebouncedInput
                        type="date"
                        value={newTransaction.loan_contingency_date}
                        onChange={(v) => handleTransactionPropertyChange('loan_contingency_date', v)}
                        className="clay-element border-0 mt-1"
                      />
                      {newTransaction.loan_contingency_date_status && (
                        <p className="text-sm text-gray-600 mt-1">Status: {newTransaction.loan_contingency_date_status}</p>
                      )}
                    </div>
                  )}
                  {newTransaction.appraisal_contingency_date && (
                    <div>
                      <Label>Appraisal Contingency Date</Label>
                      <DebouncedInput
                        type="date"
                        value={newTransaction.appraisal_contingency_date}
                        onChange={(v) => handleTransactionPropertyChange('appraisal_contingency_date', v)}
                        className="clay-element border-0 mt-1"
                      />
                      {newTransaction.appraisal_contingency_date_status && (
                        <p className="text-sm text-gray-600 mt-1">Status: {newTransaction.appraisal_contingency_date_status}</p>
                      )}
                    </div>
                  )}
                  {newTransaction.seller_disclosures_date && (
                    <div>
                      <Label>Seller Disclosures Delivery Date</Label>
                      <DebouncedInput
                        type="date"
                        value={newTransaction.seller_disclosures_date}
                        onChange={(v) => handleTransactionPropertyChange('seller_disclosures_date', v)}
                        className="clay-element border-0 mt-1"
                      />
                    </div>
                  )}
                  {newTransaction.disclosures_due_back_date && (
                    <div>
                      <Label>Disclosures Due Back Date</Label>
                      <DebouncedInput
                        type="date"
                        value={newTransaction.disclosures_due_back_date}
                        onChange={(v) => handleTransactionPropertyChange('disclosures_due_back_date', v)}
                        className="clay-element border-0 mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}


            {/* Contacts Section */}
            <Contacts 
              contacts={contacts} 
              transactionId={null} 
              onUpdate={() => {}} 
              isCreationMode={true}
              onContactsChange={setContacts}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => setMode('search')} className="clay-element border-0 px-6">
            Back
          </Button>
          <Button 
            onClick={handleCreateTransaction} 
            disabled={!newTransaction.agent_side || !newTransaction.status || geocoding}
            className="clay-element clay-accent-mint border-0 px-8"
          >
            {geocoding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Geocoding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Transaction
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  return null;
}
