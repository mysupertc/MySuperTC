
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmailHistory } from '@/api/entities'; // Corrected import path
import { Mail, Send, Inbox, Paperclip, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useNotifications } from '../notifications/NotificationProvider';

// Swipeable Email Item Component for transaction mailbox
const SwipeableEmailItem = ({ email, onSelect, onDelete }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const itemRef = useRef(null);

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    if (diff < 0) {
      setDragX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragX < -50) {
      if (window.confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
        onDelete(email.id);
      }
    }
    setDragX(0);
  };

  const handleMouseDown = (e) => {
    setStartX(e.clientX);
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const currentX = e.clientX;
    const diff = currentX - startX;
    if (diff < 0) {
      setDragX(Math.max(diff, -100));
    }
  }, [isDragging, startX]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (dragX < -50) {
      if (window.confirm('Are you sure you want to delete this email? This action cannot be undone.')) {
        onDelete(email.id);
      }
    }
    setDragX(0);
  }, [dragX, onDelete, email.id]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative overflow-hidden">
      <div
        ref={itemRef}
        className="transition-transform duration-200"
        style={{ transform: `translateX(${dragX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="group flex items-center gap-4 p-4 bg-white rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors" onClick={() => onSelect(email)}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            email.direction === 'sent' ? 'bg-blue-100' : 'bg-green-100'
          }`}>
            {email.direction === 'sent' ? (
              <Send className="w-5 h-5 text-blue-600" />
            ) : (
              <Inbox className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">{email.subject}</h4>
              <Badge variant={email.direction === 'sent' ? 'default' : 'secondary'} className="text-xs">
                {email.direction === 'sent' ? 'Sent' : 'Received'}
              </Badge>
              {email.attachments && email.attachments.length > 0 && (
                <Paperclip className="w-3 h-3 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">
              {email.direction === 'sent' ? 'To: ' : 'From: '}
              {email.to_addresses?.join(', ') || email.from_address}
            </p>
          </div>
          
          <div className="text-xs text-gray-500 text-right">
            {format(new Date(email.sent_at), 'MMM d')}
            <br />
            {format(new Date(email.sent_at), 'h:mm a')}
          </div>
        </div>
      </div>
      {/* Delete background */}
      <div 
        className="absolute top-0 right-0 h-full w-20 bg-red-500 flex items-center justify-center -z-10" 
        style={{ transform: `translateX(${Math.max(0, dragX + 100)}px)` }} // Only show when dragX is negative
      >
        <Trash2 className="w-5 h-5 text-white" />
      </div>
    </div>
  );
};

export default function EmailMailbox({ transactionId, onComposeClick }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  
  const { emailUpdateTrigger, triggerEmailRefresh } = useNotifications();

  const loadEmails = useCallback(async () => {
    if (!transactionId) return;

    try {
      console.log(`EmailMailbox: Loading emails for transaction ${transactionId}`);
      
      // Get emails for this transaction AND emails with null transaction_id that might be unlinked replies
      const [transactionEmails, unlinkedEmails] = await Promise.all([
        EmailHistory.filter({ transaction_id: transactionId }, '-sent_at'),
        EmailHistory.filter({ transaction_id: null }, '-sent_at', 20)
      ]);
      
      // For unlinked emails, try to find ones that might belong to this transaction by thread matching
      const linkedUnlinkedEmails = [];
      if (transactionEmails.length > 0) {
        const transactionThreadIds = new Set(transactionEmails.map(e => e.gmail_thread_id).filter(Boolean));
        
        for (const unlinkedEmail of unlinkedEmails) {
          if (unlinkedEmail.gmail_thread_id && transactionThreadIds.has(unlinkedEmail.gmail_thread_id)) {
            console.log(`EmailMailbox: Found unlinked email "${unlinkedEmail.subject}" (ID: ${unlinkedEmail.id}) that matches thread for transaction ${transactionId}`);
            linkedUnlinkedEmails.push(unlinkedEmail);
          }
        }
      }
      
      const allEmails = [...transactionEmails, ...linkedUnlinkedEmails]
        .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
      
      console.log(`EmailMailbox: Loaded ${transactionEmails.length} direct emails + ${linkedUnlinkedEmails.length} thread-matched emails = ${allEmails.length} total`);
      setEmails(allEmails);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (transactionId) {
      loadEmails();
    }
  }, [transactionId, loadEmails, emailUpdateTrigger]);

  const handleDeleteEmail = async (emailId) => {
    try {
      await EmailHistory.delete(emailId);
      console.log(`EmailMailbox: Deleted email ${emailId}`);
      triggerEmailRefresh(); // Use the global trigger to ensure all components refresh
      setSelectedEmail(null);
      // Immediately reload to reflect the deletion
      loadEmails();
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email.');
    }
  };

  if (loading) {
    return (
      <Card className="clay-element border-0">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedEmail) {
    return (
      <Card className="clay-element border-0">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
               <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-red-500"
                onClick={() => handleDeleteEmail(selectedEmail.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmail(null)}
              >
                Back
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={selectedEmail.direction === 'sent' ? 'default' : 'secondary'}>
                {selectedEmail.direction === 'sent' ? 'Sent' : 'Received'}
              </Badge>
              <span>{format(new Date(selectedEmail.sent_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            <div>
              {selectedEmail.direction === 'sent' ? 'To: ' : 'From: '}
              {selectedEmail.to_addresses?.join(', ') || selectedEmail.from_address}
            </div>
            {selectedEmail.cc_addresses && selectedEmail.cc_addresses.length > 0 && (
              <div>CC: {selectedEmail.cc_addresses.join(', ')}</div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedEmail.body.replace(/\n/g, '<br>') }}
          />
          {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-medium mb-2">Attachments:</h4>
              <div className="space-y-2">
                {selectedEmail.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <a
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Attachment {index + 1}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="clay-element border-0">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-xl flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email History
        </CardTitle>
        <Button size="sm" variant="outline" className="clay-element" onClick={() => onComposeClick()}>
          <Plus className="w-4 h-4 mr-2"/>
          New Email
        </Button>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No emails for this property yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map(email => (
              <SwipeableEmailItem
                key={email.id}
                email={email}
                onSelect={setSelectedEmail}
                onDelete={handleDeleteEmail}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
