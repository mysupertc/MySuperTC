import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient"; // Make sure you have supabase client setup
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User, Briefcase, Building, Users } from "lucide-react";

const CONTACT_GROUPS = [
  { title: "Buyer/Seller", key: "client", icon: User, types: ["buyer", "seller", "both"] },
  { title: "Agent", key: "agent", icon: Briefcase, types: ["seller_agent", "buyer_agent"] },
  { title: "Brokerage Firm", key: "brokerage", icon: Building, types: ["seller_brokerage", "buyer_brokerage"] },
  { title: "Escrow", key: "escrow", icon: Building, types: ["escrow"] },
  { title: "Title", key: "title", icon: Building, types: ["title"] },
  { title: "Lender", key: "lender", icon: Building, types: ["lender"] },
  { title: "Miscellaneous", key: "misc", icon: Users, types: ["misc"] },
];

export default function ContactsPage() {
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Load from Supabase
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fixed table names
        const { data: clientData, error: clientError } = await supabase.from("clients").select("*");
        const { data: contactData, error: contactError } = await supabase.from("contacts").select("*");

        if (clientError) throw clientError;
        if (contactError) throw contactError;

        setClients(clientData || []);
        setContacts(contactData || []);
      } catch (error) {
        console.error("❌ Error loading contacts data:", error.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ✅ Merge + Search
  const filteredData = useMemo(() => {
    const allContacts = [
      ...clients.map((c) => ({ ...c, type: "client", contact_type: c.client_type })),
      ...contacts.map((c) => ({ ...c, type: "contact" })),
    ];

    if (!searchTerm) return allContacts;

    return allContacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, contacts, searchTerm]);

  // ✅ Group into buckets
  const groupedContacts = useMemo(() => {
    const groups = {};
    CONTACT_GROUPS.forEach((g) => {
      groups[g.key] = [];
    });

    filteredData.forEach((contact) => {
      for (const group of CONTACT_GROUPS) {
        if (contact.type === "client" && group.key === "client") {
          groups.client.push(contact);
          break;
        }
        if (contact.type === "contact" && group.types.includes(contact.contact_type)) {
          groups[group.key].push(contact);
          break;
        }
      }
    });

    for (const key in groups) {
      groups[key].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return groups;
  }, [filteredData]);

  // ✅ Loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  // ✅ Render
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Contacts</h1>
          <p className="text-gray-600 mt-1">Your entire network in one place.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search all contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 clay-element border-0 w-64"
          />
        </div>
      </div>

      <div className="space-y-8">
        {CONTACT_GROUPS.map((group) => {
          const contactsInGroup = groupedContacts[group.key];
          if (!contactsInGroup || contactsInGroup.length === 0) return null;

          return (
            <Card key={group.key} className="clay-element border-0">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <group.icon className="w-5 h-5 text-indigo-600" />
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contactsInGroup.map((contact) => (
                  <div key={contact.id} className="clay-element p-4">
                    <p className="font-semibold text-gray-800">{contact.name}</p>
                    <p className="text-sm text-blue-600">{contact.email}</p>
                    {contact.cell_phone && <p className="text-sm text-gray-500">{contact.cell_phone}</p>}
                    {contact.transaction_id && (
                      <p className="text-xs text-gray-400 mt-2">
                        From Transaction: {contact.transaction_id.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}