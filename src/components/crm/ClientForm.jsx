import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

export default function ClientForm({ client = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    cell_phone: client?.cell_phone || '',
    office_phone: client?.office_phone || '',
    client_type: client?.client_type || '',
    notes: client?.notes || '',
    last_contact_date: client?.last_contact_date || '',
    preferred_contact_method: client?.preferred_contact_method || 'email'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="icon"
          onClick={onCancel}
          className="clay-element border-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {client ? 'Edit Client' : 'New Client'}
          </h1>
          <p className="text-gray-600">Manage your client information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="clay-element border-0">
          <CardHeader>
            <CardTitle className="text-xl">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className="clay-element border-0 mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="john@example.com"
                className="clay-element border-0 mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="client_type">Client Type *</Label>
              <Select 
                value={formData.client_type} 
                onValueChange={(value) => handleInputChange('client_type', value)}
              >
                <SelectTrigger className="clay-element border-0 mt-1">
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent className="clay-element border-0">
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="seller">Seller</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cell_phone">Cell Phone</Label>
              <Input
                id="cell_phone"
                value={formData.cell_phone}
                onChange={(e) => handleInputChange('cell_phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="office_phone">Office Phone</Label>
              <Input
                id="office_phone"
                value={formData.office_phone}
                onChange={(e) => handleInputChange('office_phone', e.target.value)}
                placeholder="(555) 987-6543"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="preferred_contact_method">Preferred Contact</Label>
              <Select 
                value={formData.preferred_contact_method} 
                onValueChange={(value) => handleInputChange('preferred_contact_method', value)}
              >
                <SelectTrigger className="clay-element border-0 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="clay-element border-0">
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="last_contact_date">Last Contact Date</Label>
              <Input
                id="last_contact_date"
                type="date"
                value={formData.last_contact_date}
                onChange={(e) => handleInputChange('last_contact_date', e.target.value)}
                className="clay-element border-0 mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Client preferences, important details, etc."
                className="clay-element border-0 mt-1"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="clay-element border-0 px-6"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="clay-element clay-accent-mint border-0 px-6"
          >
            <Save className="w-4 h-4 mr-2" />
            {client ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </form>
    </div>
  );
}