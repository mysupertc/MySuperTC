
import React, { useState, useEffect, useCallback } from "react";
import { Client } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, Mail, Phone, Calendar } from "lucide-react";
import ClientForm from "../components/crm/ClientForm";

export default function CRM() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadClients = useCallback(async () => {
    try {
      const data = await Client.list('-created_date');
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array as loadClients doesn't depend on any state/props that change during its lifecycle

  const filterClients = useCallback(() => {
    if (!searchTerm) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client =>
      client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]); // filterClients depends on clients and searchTerm

  useEffect(() => {
    loadClients();
  }, [loadClients]); // Depend on loadClients memoized by useCallback

  useEffect(() => {
    filterClients();
  }, [filterClients]); // Depend on filterClients memoized by useCallback

  const handleCreateClient = async (clientData) => {
    try {
      await Client.create(clientData);
      setShowNewForm(false);
      loadClients();
    } catch (error) {
      console.error('Error creating client:', error);
    }
  };

  const handleUpdateClient = async (clientData) => {
    try {
      await Client.update(editingClient.id, clientData);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const getClientTypeColor = (type) => {
    switch (type) {
      case 'buyer': return 'bg-blue-100 text-blue-700';
      case 'seller': return 'bg-green-100 text-green-700';
      case 'both': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (showNewForm) {
    return (
      <div className="p-6">
        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setShowNewForm(false)}
        />
      </div>
    );
  }

  if (editingClient) {
    return (
      <div className="p-6">
        <ClientForm
          client={editingClient}
          onSubmit={handleUpdateClient}
          onCancel={() => setEditingClient(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships</p>
        </div>
        <Button 
          onClick={() => setShowNewForm(true)}
          className="clay-element clay-accent-mint border-0 hover:shadow-lg px-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Client
        </Button>
      </div>

      <Card className="clay-element border-0 bg-transparent shadow-none">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">All Clients</CardTitle>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 clay-element border-0 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl bg-white p-4 animate-pulse shadow-md">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {clients.length === 0 ? 'No clients yet' : 'No matching clients'}
              </h3>
              <p className="text-gray-500 mb-6">
                {clients.length === 0 
                  ? 'Add your first client to get started'
                  : 'Try adjusting your search term'
                }
              </p>
              {clients.length === 0 && (
                <Button 
                  onClick={() => setShowNewForm(true)}
                  className="clay-element clay-accent-mint border-0"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredClients.map(client => (
                <div key={client.id} className="group block overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => setEditingClient(client)}>
                  <div className="h-40 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                     <span className="text-4xl font-semibold text-blue-600">
                        {client.name?.charAt(0).toUpperCase() || 'C'}
                     </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 text-base truncate">
                          {client.name}
                        </h3>
                        <Badge className={`border-0 text-xs capitalize font-medium ${getClientTypeColor(client.client_type)}`}>{client.client_type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 truncate">{client.email}</p>
                    {client.cell_phone && <p className="text-sm text-gray-500">{client.cell_phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
