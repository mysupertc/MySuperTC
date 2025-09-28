import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  X,
  Edit,
  Save,
  Calendar,
  DollarSign,
  Percent
} from 'lucide-react';
import { UploadFile, ExtractDataFromUploadedFile } from '@/api/integrations';
import { format, add, parseISO, isWeekend } from 'date-fns';

export default function DocumentUpload({ onDataExtracted, offerAcceptanceDate }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const uploadResponse = await UploadFile({ file });
        return {
          name: file.name,
          url: uploadResponse.file_url
        };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploadedResults]);

      // Extract data from all uploaded files
      const extractPromises = uploadedResults.map(async (file) => {
        return await ExtractDataFromUploadedFile({
          file_url: file.url,
          json_schema: {
            type: "object",
            properties: {
              sales_price: { type: "number", description: "Final negotiated sales price" },
              emd_amount: { type: "number", description: "Earnest money deposit amount" },
              emd_percentage: { type: "number", description: "Earnest money deposit percentage" },
              investigation_contingency_days: { type: "number", description: "Investigation contingency period in days" },
              investigation_contingency_date: { type: "string", description: "Specific investigation contingency date" },
              loan_contingency_days: { type: "number", description: "Loan contingency period in days" },
              loan_contingency_date: { type: "string", description: "Specific loan contingency date" },
              appraisal_contingency_days: { type: "number", description: "Appraisal contingency period in days" },
              appraisal_contingency_date: { type: "string", description: "Specific appraisal contingency date" },
              buyer_commission_amount: { type: "number", description: "Buyer agent commission amount" },
              buyer_commission_percentage: { type: "number", description: "Buyer agent commission percentage" },
              disclosures_due_back_days: { type: "number", description: "Days for disclosures to be returned" },
              disclosures_due_back_date: { type: "string", description: "Specific date for disclosures to be returned" },
              seller_disclosures_delivery_days: { type: "number", description: "Days for seller to deliver disclosures" },
              seller_disclosures_delivery_date: { type: "string", description: "Specific date for seller disclosures delivery" },
              home_warranty_amount: { type: "number", description: "Home warranty cost" },
              home_warranty_paid_by: { type: "string", description: "Who pays for home warranty - seller or buyer" },
              waived_contingencies: { 
                type: "array", 
                items: { type: "string" },
                description: "List of waived contingencies (investigation, loan, appraisal, etc.)" 
              },
              special_notes: { type: "string", description: "Any special terms or notes" }
            }
          }
        });
      });

      const extractResults = await Promise.all(extractPromises);
      
      // Combine extracted data from all files
      const combinedData = {};
      extractResults.forEach(result => {
        if (result.status === 'success' && result.output) {
          Object.assign(combinedData, result.output);
        }
      });

      if (Object.keys(combinedData).length > 0) {
        const processedData = processExtractedData(combinedData);
        setExtractedData(processedData);
        setEditData(processedData);
        setIsEditing(true);
      }

    } catch (error) {
      console.error('Error uploading/extracting files:', error);
    } finally {
      setUploading(false);
    }
  };

  const processExtractedData = (rawData) => {
    const processed = { ...rawData };

    // Calculate dates based on offer acceptance date and days
    if (offerAcceptanceDate) {
      const baseDate = parseISO(offerAcceptanceDate);

      // Investigation contingency
      if (rawData.investigation_contingency_days && !rawData.investigation_contingency_date) {
        processed.investigation_contingency_date = calculateBusinessDays(baseDate, rawData.investigation_contingency_days);
      }

      // Loan contingency
      if (rawData.loan_contingency_days && !rawData.loan_contingency_date) {
        processed.loan_contingency_date = calculateBusinessDays(baseDate, rawData.loan_contingency_days);
      }

      // Appraisal contingency
      if (rawData.appraisal_contingency_days && !rawData.appraisal_contingency_date) {
        processed.appraisal_contingency_date = calculateBusinessDays(baseDate, rawData.appraisal_contingency_days);
      }

      // Disclosures due back
      if (rawData.disclosures_due_back_days && !rawData.disclosures_due_back_date) {
        processed.disclosures_due_back_date = calculateBusinessDays(baseDate, rawData.disclosures_due_back_days);
      }

      // Seller disclosures delivery
      if (rawData.seller_disclosures_delivery_days && !rawData.seller_disclosures_delivery_date) {
        processed.seller_disclosures_delivery_date = calculateBusinessDays(baseDate, rawData.seller_disclosures_delivery_days);
      }
    }

    // Set statuses for waived contingencies
    if (rawData.waived_contingencies && Array.isArray(rawData.waived_contingencies)) {
      rawData.waived_contingencies.forEach(waived => {
        const lowerWaived = waived.toLowerCase();
        if (lowerWaived.includes('investigation')) {
          processed.investigation_contingency_date_status = 'waived';
        }
        if (lowerWaived.includes('loan')) {
          processed.loan_contingency_date_status = 'waived';
        }
        if (lowerWaived.includes('appraisal')) {
          processed.appraisal_contingency_date_status = 'waived';
        }
      });
    }

    return processed;
  };

  const calculateBusinessDays = (startDate, days) => {
    let result = new Date(startDate);
    let addedDays = 0;
    
    while (addedDays < days) {
      result = add(result, { days: 1 });
      if (!isWeekend(result)) {
        addedDays++;
      }
    }
    
    return format(result, 'yyyy-MM-dd');
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveExtractedData = () => {
    onDataExtracted(editData);
    setIsEditing(false);
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="clay-element border-0">
        <CardHeader>
          <CardTitle className="text-lg">Upload Purchase Agreement & Counter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                PDF, PNG, JPG files (multiple files supported)
              </p>
            </label>
          </div>

          {uploading && (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Processing documents...</p>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Uploaded Files:</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {extractedData && (
        <Card className="clay-element border-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Extracted Contract Data</CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSaveExtractedData} size="sm" className="clay-accent-mint">
                    <Save className="w-4 h-4 mr-2" />
                    Apply Data
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Data
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Sales Price</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editData.sales_price || ''}
                      onChange={(e) => handleEditChange('sales_price', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold text-green-600">
                      ${extractedData.sales_price?.toLocaleString() || 'N/A'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Earnest Money Deposit</Label>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={editData.emd_amount || ''}
                        onChange={(e) => handleEditChange('emd_amount', parseFloat(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="Percentage"
                        value={editData.emd_percentage || ''}
                        onChange={(e) => handleEditChange('emd_percentage', parseFloat(e.target.value))}
                      />
                    </div>
                  ) : (
                    <p className="font-semibold">
                      {extractedData.emd_amount ? `$${extractedData.emd_amount.toLocaleString()}` : ''}
                      {extractedData.emd_percentage ? ` (${extractedData.emd_percentage}%)` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Buyer Agent Commission</Label>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={editData.buyer_commission_amount || ''}
                        onChange={(e) => handleEditChange('buyer_commission_amount', parseFloat(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="Percentage"
                        value={editData.buyer_commission_percentage || ''}
                        onChange={(e) => handleEditChange('buyer_commission_percentage', parseFloat(e.target.value))}
                      />
                    </div>
                  ) : (
                    <p className="font-semibold">
                      {extractedData.buyer_commission_amount ? `$${extractedData.buyer_commission_amount.toLocaleString()}` : ''}
                      {extractedData.buyer_commission_percentage ? ` (${extractedData.buyer_commission_percentage}%)` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Home Warranty</Label>
                  {isEditing ? (
                    <div className="space-y-2 mt-1">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={editData.home_warranty_amount || ''}
                        onChange={(e) => handleEditChange('home_warranty_amount', parseFloat(e.target.value))}
                      />
                      <select
                        value={editData.home_warranty_paid_by || ''}
                        onChange={(e) => handleEditChange('home_warranty_paid_by', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Who pays?</option>
                        <option value="seller">Seller</option>
                        <option value="buyer">Buyer</option>
                      </select>
                    </div>
                  ) : (
                    <p className="font-semibold">
                      {extractedData.home_warranty_amount ? `$${extractedData.home_warranty_amount.toLocaleString()}` : 'N/A'}
                      {extractedData.home_warranty_paid_by ? ` (Paid by ${extractedData.home_warranty_paid_by})` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Investigation Contingency</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.investigation_contingency_date || ''}
                      onChange={(e) => handleEditChange('investigation_contingency_date', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">
                      {extractedData.investigation_contingency_date || 'N/A'}
                      {extractedData.investigation_contingency_date_status === 'waived' && 
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Waived</Badge>
                      }
                    </p>
                  )}
                </div>

                <div>
                  <Label>Loan Contingency</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.loan_contingency_date || ''}
                      onChange={(e) => handleEditChange('loan_contingency_date', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">
                      {extractedData.loan_contingency_date || 'N/A'}
                      {extractedData.loan_contingency_date_status === 'waived' && 
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Waived</Badge>
                      }
                    </p>
                  )}
                </div>

                <div>
                  <Label>Appraisal Contingency</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.appraisal_contingency_date || ''}
                      onChange={(e) => handleEditChange('appraisal_contingency_date', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">
                      {extractedData.appraisal_contingency_date || 'N/A'}
                      {extractedData.appraisal_contingency_date_status === 'waived' && 
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Waived</Badge>
                      }
                    </p>
                  )}
                </div>

                <div>
                  <Label>Seller Disclosures Delivery</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.seller_disclosures_delivery_date || ''}
                      onChange={(e) => handleEditChange('seller_disclosures_delivery_date', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">{extractedData.seller_disclosures_delivery_date || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label>Disclosures Due Back</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editData.disclosures_due_back_date || ''}
                      onChange={(e) => handleEditChange('disclosures_due_back_date', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold">{extractedData.disclosures_due_back_date || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>

            {extractedData.special_notes && (
              <div className="mt-4">
                <Label>Special Notes</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.special_notes || ''}
                    onChange={(e) => handleEditChange('special_notes', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-gray-700">{extractedData.special_notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}