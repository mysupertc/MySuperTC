
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Transaction, Contact, DisclosureItem, TaskItem } from "@/api/entities";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

import ActiveTransactionsSlider from "../components/transactions/ActiveTransactionsSlider";
import TransactionHeader from "../components/transactions/TransactionHeader";
import TransactionInfo from "../components/transactions/TransactionInfo";
import ImportantDates from "../components/transactions/ImportantDates";
import Checklist from "../components/transactions/Checklist";
import Contacts from "../components/transactions/Contacts";
import TransactionLocationMap from "../components/transactions/TransactionLocationMap";
import TransactionTimeline from "../components/transactions/TransactionTimeline";
import TransactionCalendarGrid from "../components/transactions/TransactionCalendarGrid"; // Import the new component
import EmailMailbox from "../components/transactions/EmailMailbox";
import FloatingEmailWidget from "../components/email/FloatingEmailWidget"; // Import the floating email widget
import { getMapboxToken } from "@/api/functions";

const isDisclosureCompleted = (item) => {
    // NEVER archive based on "prepared" - only when actual signing requirements are met
    return (item.seller_signed && item.buyer_signed) ||
           (item.seller_signed && item.no_seller_buyer) ||
           (item.buyer_signed && item.no_seller_buyer) ||
           (item.no_seller_buyer && !item.seller_signed && !item.buyer_signed && item.document_name === 'N/A');
};

const isTaskCompleted = (item) => {
    // For tasks, only "completed" checkbox means archived
    return item.completed;
};

export default function TransactionDetail() {
  const location = useLocation();
  const [transaction, setTransaction] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [disclosureItems, setDisclosureItems] = useState([]);
  const [taskItems, setTaskItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionId, setTransactionId] = useState(null);
  const [scrollToSalesPrice, setScrollToSalesPrice] = useState(false);
  const [mapboxToken, setMapboxToken] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // New state for toggling view
  const [showEmailComposer, setShowEmailComposer] = useState(false);

  // Function to geocode an address using Mapbox API
  const geocodeAddress = useCallback(async (address, token) => {
    if (!address || !token) {
      console.warn("Address or Mapbox token missing for geocoding.");
      return null;
    }
    const encodedAddress = encodeURIComponent(address);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${token}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        return { latitude, longitude };
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
    }
    return null;
  }, []); // No dependencies as 'token' is passed as an argument

  const loadAllData = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const [
        transactionData,
        contactsData,
        disclosuresData,
        tasksData,
        tokenResponse
      ] = await Promise.all([
        Transaction.get(id),
        Contact.filter({ transaction_id: id }),
        DisclosureItem.filter({ transaction_id: id }, 'order_index'),
        TaskItem.filter({ transaction_id: id }, 'order_index'),
        getMapboxToken()
      ]);
      setTransaction(transactionData);
      setContacts(contactsData);
      setDisclosureItems(disclosuresData);
      setTaskItems(tasksData);
      if (tokenResponse && tokenResponse.data && tokenResponse.data.token) {
        setMapboxToken(tokenResponse.data.token);
      }

    } catch (error) {
      console.error("Error loading transaction details:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setTransactionId(id);
      loadAllData(id);
    } else {
      setLoading(false);
    }
  }, [location.search, loadAllData]);
  
  const handleTransactionUpdate = async (updatedData) => {
    if (!transactionId) return;

    let dataToUpdate = { ...updatedData };

    // Check if any address-related fields have changed
    const addressFields = ['street_address', 'city', 'state', 'zip_code'];
    const addressChanged = transaction && addressFields.some(field => 
      updatedData.hasOwnProperty(field) && updatedData[field] !== transaction[field]
    );

    if (addressChanged && mapboxToken) {
      const currentStreet = updatedData.street_address !== undefined ? updatedData.street_address : transaction.street_address;
      const currentCity = updatedData.city !== undefined ? updatedData.city : transaction.city;
      const currentState = updatedData.state !== undefined ? updatedData.state : transaction.state;
      const currentZip = updatedData.zip_code !== undefined ? updatedData.zip_code : transaction.zip_code;

      const fullAddress = [
        currentStreet,
        currentCity,
        currentState,
        currentZip,
      ].filter(Boolean).join(", ");

      if (fullAddress.trim()) {
        const geoData = await geocodeAddress(fullAddress, mapboxToken);
        if (geoData) {
          dataToUpdate.latitude = geoData.latitude;
          dataToUpdate.longitude = geoData.longitude;
        } else {
            console.warn("Geocoding failed for address:", fullAddress);
            // Optionally, clear existing lat/lng if geocoding fails, or keep old ones
            // dataToUpdate.latitude = null;
            // dataToUpdate.longitude = null;
        }
      } else {
        // If address fields are cleared, also clear lat/lng
        dataToUpdate.latitude = null;
        dataToUpdate.longitude = null;
      }
    }

    await Transaction.update(transactionId, dataToUpdate);
    // Optimistically update state to avoid full reload
    setTransaction(prev => ({ ...prev, ...dataToUpdate }));
  };

  const pendingDisclosuresCount = useMemo(() => 
    disclosureItems.filter(item => !isDisclosureCompleted(item)).length,
    [disclosureItems]
  );

  const pendingTasksCount = useMemo(() => 
    taskItems.filter(item => !item.completed).length,
    [taskItems]
  );

  const handleScrollToTransactionDetails = () => {
    setScrollToSalesPrice(true);
    // Scroll to the transaction details section
    setTimeout(() => {
      const element = document.getElementById('transaction-details');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      // Reset the flag after a short delay
      setTimeout(() => setScrollToSalesPrice(false), 1000);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold">Transaction not found</h2>
        <p className="text-gray-600 mb-6">Could not find the requested transaction. It may have been deleted.</p>
        <Link to={createPageUrl("Transactions")}>
          <Button className="clay-element clay-accent-mint border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transactions
          </Button>
        </Link>
      </div>
    );
  }

  const disclosureSections = [
    { title: "Purchase Agreement & Counters", key: "purchase_agreement" },
    { title: "Disclosures", key: "disclosures" },
    { title: "Broker Disclosures", key: "broker_disclosures" },
    ...(transaction.agent_side === 'seller_side' || transaction.agent_side === 'both_sides' 
      ? [{ title: "Listing Agreement", key: "listing_agreement" }] 
      : []),
  ];

  const disclosureColumns = [
    { title: "Prepared", type: "checkbox", key: "prepared" },
    { title: "Document", type: "text", key: "document_name" },
    { title: "Seller", type: "checkbox", key: "seller_signed" },
    { title: "Buyer", type: "checkbox", key: "buyer_signed" },
    { title: "No Seller/Buyer", type: "checkbox", key: "no_seller_buyer" },
    { title: "Notes", type: "text", key: "notes" },
  ];

  const taskSections = [
    { title: "Agent/Broker Checklist", key: "agent_broker" },
    { title: "Escrow & Title Checklist", key: "escrow_title" },
  ];

  const taskColumns = [
    { title: "Task", type: "text", key: "task_name" },
    { title: "Due Date", type: "date", key: "due_date" },
    { title: "Completed", type: "checkbox", key: "completed" },
    { title: "Notes", type: "text", key: "notes" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {showEmailComposer && (
        <FloatingEmailWidget 
          autoOpenDraft={true} 
          draftData={{ transactionId: transactionId }}
          onClose={() => setShowEmailComposer(false)}
        />
      )}
      <ActiveTransactionsSlider />

      <TransactionHeader
        transaction={transaction}
        onUpdate={handleTransactionUpdate}
        pendingDisclosures={pendingDisclosuresCount}
        pendingTasks={pendingTasksCount}
        onScrollToTransactionDetails={handleScrollToTransactionDetails}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TransactionInfo 
            transaction={transaction} 
            onUpdate={handleTransactionUpdate}
            scrollToSalesPrice={scrollToSalesPrice}
          />
          
          <div id="disclosures-checklist">
            <Checklist
              title="Disclosures Checklist"
              items={disclosureItems}
              ItemEntity={DisclosureItem}
              transactionId={transactionId}
              sections={disclosureSections}
              columns={disclosureColumns}
              onUpdate={() => loadAllData(transactionId)}
              completionLogic={isDisclosureCompleted}
            />
          </div>

          <div id="tasks-checklist">
            <Checklist
              title="Task Checklist"
              items={taskItems}
              ItemEntity={TaskItem}
              transactionId={transactionId}
              sections={taskSections}
              columns={taskColumns}
              onUpdate={() => loadAllData(transactionId)}
              completionLogic={isTaskCompleted}
            />
          </div>
        </div>

        <div className="space-y-8">
          <ImportantDates 
            transaction={transaction} 
            onUpdate={handleTransactionUpdate}
            transactionId={transactionId}
          />
          
          {/* Calendar/Timeline Toggle Section */}
          <div className="clay-element border-0 p-4">
            <div className="flex justify-center mb-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className="text-sm px-4"
                >
                  Timeline
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="text-sm px-4"
                >
                  Calendar
                </Button>
              </div>
            </div>
            
            {viewMode === 'timeline' ? (
              <TransactionTimeline
                transaction={transaction}
                taskItems={taskItems}
                onUpdate={() => loadAllData(transactionId)}
              />
            ) : (
              <TransactionCalendarGrid
                transaction={transaction}
                taskItems={taskItems}
                disclosureItems={disclosureItems}
                onUpdate={() => loadAllData(transactionId)}
                transactionId={transactionId}
              />
            )}
          </div>

          <EmailMailbox transactionId={transactionId} onComposeClick={() => setShowEmailComposer(true)} />
          <TransactionLocationMap
            transaction={transaction}
            mapboxToken={mapboxToken}
          />
          <Contacts contacts={contacts} transactionId={transactionId} onUpdate={() => loadAllData(transactionId)} />
        </div>
      </div>
    </div>
  );
}
