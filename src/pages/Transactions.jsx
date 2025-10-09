import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TransactionGroup from "../components/transactions/TransactionGroup";
import TransactionsMap from "../components/transactions/TransactionsMap";
import { getMapboxToken, geocodeAddress } from "@/api/functions";

const STATUS_GROUPS = [
  { title: "Contingent", key: "active_contingent" },
  { title: "Noncontingent", key: "active_noncontingent" },
  { title: "Seller in Possession", key: "seller_in_possession" },
  { title: "Closed", key: "closed" },
  { title: "Cancelled", key: "cancelled" },
];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mapboxToken, setMapboxToken] = useState(null);

  // ✅ Load transactions + mapbox
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: allData, error: txError }, tokenResponse] = await Promise.all([
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        getMapboxToken()
      ]);

      if (txError) throw txError;
      setTransactions(allData || []);

      if (tokenResponse?.data?.token) {
        setMapboxToken(tokenResponse.data.token);
      } else {
        console.error("Failed to fetch Mapbox token:", tokenResponse);
      }

      // Auto-geocode missing
      geocodeMissingTransactions(allData || []);

    } catch (error) {
      console.error("❌ Error loading transactions:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Geocode any transactions without coords
  const geocodeMissingTransactions = useCallback(async (transactionList) => {
    const missingCoords = transactionList.filter(
      (t) => t.property_address && (!t.latitude || !t.longitude)
    );

    for (const transaction of missingCoords) {
      try {
        const response = await geocodeAddress({ address: transaction.property_address });
        if (response.data.success) {
          await supabase
            .from("transactions")
            .update({
              latitude: response.data.latitude,
              longitude: response.data.longitude,
            })
            .eq("id", transaction.id);
        }
        await new Promise((resolve) => setTimeout(resolve, 200)); // throttle
      } catch (error) {
        console.error(`❌ Failed geocoding ${transaction.property_address}:`, error.message);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ✅ Group into status buckets
  const groupedTransactions = useMemo(() => {
    const activeStatuses = STATUS_GROUPS.map((g) => g.key);

    const displayTransactions = transactions.filter(
      (t) =>
        activeStatuses.includes(t.status) &&
        t.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = {};
    STATUS_GROUPS.forEach((g) => {
      const groupTransactions = displayTransactions
        .filter((t) => t.status === g.key)
        .sort((a, b) => {
          const dateA = a.close_of_escrow_date ? new Date(a.close_of_escrow_date) : new Date("2999-12-31");
          const dateB = b.close_of_escrow_date ? new Date(b.close_of_escrow_date) : new Date("2999-12-31");
          return dateA.getTime() - dateB.getTime();
        });
      if (groupTransactions.length > 0) groups[g.key] = groupTransactions;
    });

    return groups;
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Transactions</h1>
          <p className="text-gray-600 mt-1">Manage all your ongoing and closed deals.</p>
        </div>
        <Link to={createPageUrl("NewTransaction")}>
          <Button className="clay-accent-mint px-6">
            <Plus className="w-5 h-5 mr-2" />
            New Transaction
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Loader or groups */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : transactions.filter((t) => STATUS_GROUPS.map((g) => g.key).includes(t.status)).length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No active transactions yet</h3>
          <p className="text-gray-500 mb-6">Create your first transaction to get started.</p>
          <Link to={createPageUrl("NewTransaction")}>
            <Button className="clay-accent-mint">
              <Plus className="w-4 h-4 mr-2" />
              Create First Transaction
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {STATUS_GROUPS.map(
            (group) =>
              groupedTransactions[group.key] && (
                <TransactionGroup
                  key={group.key}
                  title={group.title}
                  statusKey={group.key}
                  transactions={groupedTransactions[group.key]}
                />
              )
          )}
          {Object.keys(groupedTransactions).length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="pt-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-3 w-12 rounded-full bg-gradient-to-r from-blue-500 to-green-500"></div>
          <h2 className="text-2xl font-bold text-gray-800">Property Map</h2>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        <TransactionsMap transactions={transactions} mapboxToken={mapboxToken} />
      </div>
    </div>
  );
}