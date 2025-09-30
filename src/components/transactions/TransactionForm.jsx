import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

export default function TransactionForm({ transaction = null, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    property_address: transaction?.property_address || '',
    mls_number: transaction?.mls_number || '',
    apn_number: transaction?.apn_number || '',
    escrow_number: transaction?.escrow_number || '',
    year_built: transaction?.year_built || '',
    property_sf: transaction?.property_sf || '',
    property_lot_sf: transaction?.property_lot_sf || '',
    home_warranty_amount: transaction?.home_warranty_amount || '',
    commission_listing: transaction?.commission_listing || '',
    commission_buyer: transaction?.commission_buyer || '',
    sales_price: transaction?.sales_price || '',
    emd_percentage: transaction?.emd_percentage || '',
    agent_side: transaction?.agent_side || '',
    property_type: transaction?.property_type || '',
    status: transaction?.status || 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate EMD amount if percentage is provided
    const processedData = { ...formData };
    if (formData.emd_percentage && formData.sales_price) {
      processedData.emd_amount = (formData.sales_price * formData.emd_percentage) / 100;
    }

    onSubmit(processedData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h1>
          <p className="text-gray-600">Enter the property and deal details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="clay-element border-0">
          <CardHeader>
            <CardTitle className="text-xl">Property Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="property_address">Property Address *</Label>
              <Input
                id="property_address"
                value={formData.property_address}
                onChange={(e) => handleInputChange('property_address', e.target.value)}
                placeholder="123 Main St, City, State 12345"
                className="clay-element border-0 mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="mls_number">MLS Number</Label>
              <Input
                id="mls_number"
                value={formData.mls_number}
                onChange={(e) => handleInputChange('mls_number', e.target.value)}
                placeholder="MLS123456"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="apn_number">APN Number</Label>
              <Input
                id="apn_number"
                value={formData.apn_number}
                onChange={(e) => handleInputChange('apn_number', e.target.value)}
                placeholder="123-456-789"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="property_type">Property Type *</Label>
              <Select 
                value={formData.property_type} 
                onValueChange={(value) => handleInputChange('property_type', value)}
              >
                <SelectTrigger className="clay-element border-0 mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent className="clay-element border-0">
                  <SelectItem value="single_family">Single Family Residence</SelectItem>
                  <SelectItem value="condominium">Condominium</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi_2_4">Multi (2-4)</SelectItem>
                  <SelectItem value="multi_5_plus">Multi (5+)</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="agent_side">Agent Side *</Label>
              <Select 
                value={formData.agent_side} 
                onValueChange={(value) => handleInputChange('agent_side', value)}
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
              <Label htmlFor="year_built">Year Built</Label>
              <Input
                id="year_built"
                type="number"
                value={formData.year_built}
                onChange={(e) => handleInputChange('year_built', parseInt(e.target.value))}
                placeholder="1985"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="property_sf">Property SF</Label>
              <Input
                id="property_sf"
                type="number"
                value={formData.property_sf}
                onChange={(e) => handleInputChange('property_sf', parseInt(e.target.value))}
                placeholder="2500"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="property_lot_sf">Property Lot SF</Label>
              <Input
                id="property_lot_sf"
                type="number"
                value={formData.property_lot_sf}
                onChange={(e) => handleInputChange('property_lot_sf', parseInt(e.target.value))}
                placeholder="7500"
                className="clay-element border-0 mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="clay-element border-0">
          <CardHeader>
            <CardTitle className="text-xl">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="sales_price">Sales Price</Label>
              <Input
                id="sales_price"
                type="number"
                value={formData.sales_price}
                onChange={(e) => handleInputChange('sales_price', parseFloat(e.target.value))}
                placeholder="750000"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="emd_percentage">EMD Percentage</Label>
              <Input
                id="emd_percentage"
                type="number"
                step="0.1"
                value={formData.emd_percentage}
                onChange={(e) => handleInputChange('emd_percentage', parseFloat(e.target.value))}
                placeholder="3.0"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="commission_listing">Listing Agent Commission</Label>
              <Input
                id="commission_listing"
                type="number"
                value={formData.commission_listing}
                onChange={(e) => handleInputChange('commission_listing', parseFloat(e.target.value))}
                placeholder="22500"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="commission_buyer">Buyer's Agent Commission</Label>
              <Input
                id="commission_buyer"
                type="number"
                value={formData.commission_buyer}
                onChange={(e) => handleInputChange('commission_buyer', parseFloat(e.target.value))}
                placeholder="22500"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="home_warranty_amount">Home Warranty Amount</Label>
              <Input
                id="home_warranty_amount"
                type="number"
                value={formData.home_warranty_amount}
                onChange={(e) => handleInputChange('home_warranty_amount', parseFloat(e.target.value))}
                placeholder="500"
                className="clay-element border-0 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="escrow_number">Escrow Number</Label>
              <Input
                id="escrow_number"
                value={formData.escrow_number}
                onChange={(e) => handleInputChange('escrow_number', e.target.value)}
                placeholder="ESC123456"
                className="clay-element border-0 mt-1"
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
            {transaction ? 'Update Transaction' : 'Create Transaction'}
          </Button>
        </div>
      </form>
    </div>
  );
}