import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export default function EmailSignatureEditor({ onClose }) {
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSignature();
  }, []);

  const loadSignature = async () => {
    try {
      const user = await User.me();
      setSignature(user.email_signature || '');
    } catch (error) {
      console.error('Error loading signature:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({ email_signature: signature });
      alert('Email signature saved successfully!');
      if(onClose) onClose();
    } catch (error) {
      console.error('Error saving signature:', error);
      alert('Failed to save signature. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="clay-element mt-4">
      <CardHeader>
        <CardTitle>Email Signature</CardTitle>
        <CardDescription>
          Create and manage your email signature. You can copy and paste your existing signature from Gmail or Outlook, including images.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 border rounded-lg overflow-hidden">
           <RichTextEditor value={signature} onChange={setSignature} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Signature
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}