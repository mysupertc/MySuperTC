import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient"; // use Supabase directly
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TransactionGroup from "../components/transactions/TransactionGroup";

const STATUS_GROUPS = [
  { title: "Prospecting", key: "prospecting" },
  { title: "Pre-Listing", key: "pre_listing" }, // ✅ underscore version
  { title: "Listed", key: "listed" },
];

export default function Pipeline() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const pipelineStatuses = ["prospecting", "pre_listing", "listed"];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .in("status", pipelineStatuses);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("❌ Error loading pipeline transactions:", error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const groupedTransactions = useMemo(() => {
    const filtered = transactions.filter((t) =>
      t.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = {};
    STATUS_GROUPS.forEach((g) => {
      const groupTransactions = filtered
        .filter((t) => t.status === g.key)
        .sort(
          (a, b) =>
            new Date(a.created_at || a.created_date) -
            new Date(b.created_at || b.created_date)
        );
      if (groupTransactions.length > 0) {
        groups[g.key] = groupTransactions;
      }
    });
    return groups;
  }, [transactions, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-600 mt-1">
            Manage your upcoming deals and listings.
          </p>
        </div>
        <Link to={createPageUrl("NewTransaction")}>
          <Button className="clay-accent-mint px-6">
            <Plus className="w-5 h-5 mr-2" />
            New Transaction
          </Button>
        </Link>
      </div>

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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No pipeline deals yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create a new transaction to start building your pipeline.
          </p>
          <Link to={createPageUrl("NewTransaction")}>
            <Button className="clay-accent-mint">
              <Plus className="w-4 h-4 mr-2" />
              Add to Pipeline
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
    </div>
  );
}