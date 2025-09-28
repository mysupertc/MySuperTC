
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Mail,
  Send,
  Paperclip,
  X,
  Minimize2,
  Maximize2,
  Search,
  Trash2,
  Eye,
  Download,
  Signature
} from 'lucide-react';
import { User } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { Contact } from '@/api/entities';
import { Client } from '@/api/entities';
import { EmailHistory } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import RichTextEditor from './RichTextEditor';
import EmailSignatureEditor from './EmailSignatureEditor';
import { useNotifications } from '../notifications/NotificationProvider';

// Swipeable Email Item Component
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
    if (diff < 0) { // Only allow left swipe
      setDragX(Math.max(diff, -100));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragX < -50) {
      // Show delete confirmation
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
  }, [dragX, email.id, onDelete]);

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
        <div className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100" onClick={() => onSelect(email)}>
          <div className="flex justify-between items-start">
            <div className="font-medium text-sm truncate flex-1 mr-2">{email.subject}</div>
            <div className="text-xs text-gray-400 flex-shrink-0">{format(new Date(email.sent_at), 'MMM d')}</div>
          </div>
          <div className="text-xs text-gray-600 truncate">
            {email.direction === 'sent' ? 'To: ' : 'From: '}
            {(email.to_addresses && email.to_addresses.length > 0 ? email.to_addresses.join(', ') : email.from_address) || 'Unknown'}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mt-1" dangerouslySetInnerHTML={{ __html: email.body?.replace(/<[^>]*>?/gm, '') }} />
          {email.attachments && email.attachments.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <Paperclip className="w-3 h-3" /> {email.attachments.length} attachment(s)
            </div>
          )}
        </div>
      </div>
      {/* Delete background */}
      <div className="absolute top-0 right-0 h-full w-20 bg-red-500 flex items-center justify-center">
        <Trash2 className="w-5 h-5 text-white" />
      </div>
    </div>
  );
};

// Multi-email input with pills and search
const EmailRecipientInput = ({ emails, onEmailsChange, allContacts, placeholder, contactGroups, onAddGroup }) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const filteredContacts = useMemo(() => {
    if (!inputValue) return [];
    return allContacts.filter(contact =>
      contact.email && // Only include contacts with email addresses
      (contact.name?.toLowerCase().includes(inputValue.toLowerCase()) ||
       contact.email?.toLowerCase().includes(inputValue.toLowerCase())) &&
      !emails.includes(contact.email) // Check against email addresses, not objects
    );
  }, [inputValue, allContacts, emails]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const addEmail = (contact) => {
    if (contact && contact.email && !emails.includes(contact.email)) {
      onEmailsChange([...emails, contact.email]); // Store email address
    }
    setInputValue('');
    setShowDropdown(false);
  };

  const removeEmail = (index) => {
    onEmailsChange(emails.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (inputValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue)) {
        e.preventDefault();
        addEmail({ email: inputValue, name: inputValue }); // Pass as a contact object, addEmail extracts email
      }
    }
  };

  // Helper function to get contact name from email address
  const getContactName = (email) => {
    const contact = allContacts.find(c => c.email === email);
    return contact ? contact.name : email;
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="clay-element flex flex-wrap items-center gap-1 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-400">
        {emails.map((email, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs px-2 py-1">
            <span className="truncate max-w-[150px]">{getContactName(email)}</span>
            <button onClick={() => removeEmail(index)} className="hover:text-red-500">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm min-w-[100px]"
        />
      </div>

      {showDropdown && filteredContacts.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredContacts.map(contact => (
            <div
              key={contact.email}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => addEmail(contact)}
            >
              <p className="font-medium text-sm">{contact.name}</p>
              <p className="text-xs text-gray-500">{contact.email}</p>
            </div>
          ))}
        </div>
      )}

      {contactGroups && Object.values(contactGroups).some(group => group.filter(c => c.email).length > 0) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(contactGroups).map(([groupName, contacts]) => {
            const contactsWithEmail = contacts.filter(c => c.email);
            return contactsWithEmail.length > 0 && (
              <Button
                key={groupName}
                size="xs"
                variant="outline"
                className="text-xs h-6 px-2"
                onClick={() => onAddGroup(contactsWithEmail.map(c => c.email))} // Pass email addresses
              >
                {groupName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ({contactsWithEmail.length})
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function FloatingEmailWidget({ autoOpenDraft = false, draftData = null, onStateChange }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(autoOpenDraft);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState('compose'); // Default to compose
  const [emails, setEmails] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [clients, setClients] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [contactGroups, setContactGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { emailUpdateTrigger, triggerEmailRefresh } = useNotifications(); // Get triggerEmailRefresh

  // Compose email state - store email addresses as strings
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [toEmails, setToEmails] = useState([]); // Array of email addresses
  const [ccEmails, setCcEmails] = useState([]); // Array of email addresses
  const [bccEmails, setBccEmails] = useState([]); // Array of email addresses
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontColor: '#000000'
  });

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  // Notify parent component when state changes
  const handleToggleOpen = (newIsOpen) => {
    setIsOpen(newIsOpen);
    if (onStateChange) {
      onStateChange(newIsOpen);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, emailUpdateTrigger]); // Added emailUpdateTrigger dependency

  useEffect(() => {
    // Auto-populate draft data
    if (draftData && autoOpenDraft) {
      if (draftData.to) setToEmails(Array.isArray(draftData.to) ? draftData.to : [draftData.to]);
      if (draftData.subject) setSubject(draftData.subject);
      if (draftData.body) setBody(draftData.body);
      if (draftData.transactionId) setSelectedTransaction(draftData.transactionId);
    }
  }, [draftData, autoOpenDraft]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading email widget data...');
      const [transactionsData, contactsData, clientsData, emailsData, userData] = await Promise.all([
        Transaction.list('-created_date'),
        Contact.list(),
        Client.list(),
        EmailHistory.list('-sent_at', 50),
        User.me()
      ]);

      console.log('Loaded transactions:', transactionsData.length);
      console.log('Loaded contacts:', contactsData.length);
      console.log('Loaded clients:', clientsData.length);
      
      setTransactions(transactionsData);
      setContacts(contactsData);
      setClients(clientsData);
      setEmails(emailsData);
      setUser(userData);

      // Apply user's email preferences if available
      if (userData) {
        setUserPreferences({
          fontFamily: userData.email_font_family || 'Inter, sans-serif',
          fontSize: userData.email_font_size || '14px',
          fontColor: userData.email_font_color || '#000000'
        });
      }
    } catch (error) {
      console.error('Error loading email data:', error);
      setError('Failed to load email data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Combine contacts and clients for the recipient dropdown
  const allContacts = useMemo(() => [
    ...contacts.map(c => ({ id: c.id, name: c.name, email: c.email, type: 'contact' })),
    ...clients.map(c => ({ id: c.id, name: c.name, email: c.email, type: 'client', contact_type: c.client_type }))
  ], [contacts, clients]);

  const handleSelectTransaction = useCallback((transactionId) => {
    console.log('Selecting transaction:', transactionId);
    setSelectedTransaction(transactionId);
    const foundTransaction = transactions.find(tx => tx.id === transactionId);
    if (foundTransaction) {
      setSubject(foundTransaction.property_address);

      // Group contacts for this transaction
      const transactionContacts = contacts.filter(c => c.transaction_id === transactionId);
      const groups = transactionContacts.reduce((acc, contact) => {
        const group = contact.contact_type || 'misc';
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(contact);
        return acc;
      }, {});
      setContactGroups(groups);
    } else {
      setContactGroups({});
    }
  }, [transactions, contacts]);

  useEffect(() => {
    // Auto-select transaction based on current page and update subject
    const urlParams = new URLSearchParams(location.search);
    const transactionId = urlParams.get('id');
    if (transactionId && isOpen && activeTab === 'compose' && transactions.length > 0) {
      handleSelectTransaction(transactionId);
    }
  }, [location, isOpen, activeTab, transactions, handleSelectTransaction]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50');
    const files = Array.from(e.dataTransfer.files);
    await uploadFiles(files);
  };

  const uploadFiles = async (files) => {
    if (!files.length) return;

    // Check total file size (25MB limit)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 25 * 1024 * 1024) {
      alert('Total file size cannot exceed 25MB');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const uploadResponse = await UploadFile({ file });
        return {
          name: file.name,
          url: uploadResponse.file_url,
          size: file.size,
          type: file.type
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSignature = () => {
    if (user?.email_signature) {
      setBody(prev => `${prev}<br/><br/>${user.email_signature}`);
    } else {
      alert('No email signature configured. Please set it up in preferences.');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedTransaction || toEmails.length === 0 || !subject || !body) {
      alert('Please fill in all required fields: Property, To, Subject, and Body.');
      return;
    }

    if (!user?.is_gmail_connected) {
      alert('Please connect your Gmail account in Settings to send emails.');
      return;
    }

    setSending(true);
    try {
      const selectedTx = transactions.find(tx => tx.id === selectedTransaction);
      let finalSubject = subject;
      if (selectedTx && !subject.includes(selectedTx.property_address)) {
        finalSubject = `${subject} - ${selectedTx.property_address}`;
      }

      // Import and call the Gmail sending function
      const { sendGmailEmail } = await import('@/api/functions');
      
      console.log('Invoking sendGmailEmail with transaction_id:', selectedTransaction);

      const response = await sendGmailEmail({
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject: finalSubject,
        body: body,
        attachments: attachments,
        transaction_id: selectedTransaction // This is the crucial part
      });

      console.log('Received response from sendGmailEmail:', response);

      if (response.data?.success) {
        alert('Email sent successfully via Gmail!');
        // Reset form
        setSelectedTransaction('');
        setToEmails([]);
        setCcEmails([]);
        setBccEmails([]);
        setSubject('');
        setBody('');
        setAttachments([]);
        setContactGroups({});
        setActiveTab('history');
        triggerEmailRefresh(); // Manually trigger a refresh of all email components
      } else {
        const errorDetails = response.data?.error || response.data?.warning || 'An unknown error occurred.';
        console.error('sendGmailEmail failed or returned warning:', errorDetails);
        alert(`Failed to send email: ${errorDetails}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteEmail = async (emailId) => {
    try {
      await EmailHistory.delete(emailId);
      triggerEmailRefresh(); // Trigger refresh after deletion to update all components
      setSelectedEmail(null);
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email.');
    }
  };

  const handleSavePreferences = async (newPrefs) => {
    try {
      await User.updateMyUserData(newPrefs);
      setUserPreferences(prev => ({ ...prev, ...newPrefs }));
      alert('Email preferences saved!');
    } catch (error) {
      console.error('Error saving email preferences:', error);
      alert('Failed to save preferences.');
    }
  };

  const addGroupToField = (emailAddresses, fieldSetter) => {
    fieldSetter(prev => {
      const existingEmails = new Set(prev);
      const filteredNew = emailAddresses.filter(email => !existingEmails.has(email));
      return [...prev, ...filteredNew];
    });
  };

  const handleClose = () => {
    handleToggleOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 right-28 z-[100001]">
        <Button
          size="icon"
          className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
          onClick={() => handleToggleOpen(true)}
        >
          <Mail className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className={`fixed bottom-8 right-8 z-[100001] w-[420px] h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col transition-all duration-300 ${isMinimized ? 'h-16 w-64' : ''}`}>
        {/* Header */}
        <div className="bg-gray-50 text-gray-800 p-4 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold">Email Center</h3>
            {user?.is_gmail_connected && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Gmail Connected" />
            )}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-gray-50 m-0 rounded-none">
              <TabsTrigger value="compose" className="text-xs rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm">Compose</TabsTrigger>
              <TabsTrigger value="history" className="text-xs rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="flex-1 overflow-y-auto p-4 space-y-3 m-0" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {error}
                </div>
              )}

              {!user?.is_gmail_connected && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  <strong>Gmail not connected.</strong> Go to Settings to connect your Gmail account to send emails.
                </div>
              )}
              
              {/* Property Selector */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Property *</label>
                {loading ? (
                  <div className="clay-element h-9 text-sm border border-gray-200 flex items-center justify-center">
                    Loading...
                  </div>
                ) : (
                  <Select value={selectedTransaction} onValueChange={handleSelectTransaction}>
                    <SelectTrigger className="clay-element h-9 text-sm border border-gray-200 focus-within:border-indigo-400">
                      <SelectValue placeholder={transactions.length === 0 ? "No properties available" : "Select a Property..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto z-[100000]">
                      {transactions.map(tx => (
                        <SelectItem key={tx.id} value={tx.id} className="text-sm">
                          {tx.property_address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Recipients */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">To *</label>
                <EmailRecipientInput
                  emails={toEmails}
                  onEmailsChange={setToEmails}
                  allContacts={allContacts}
                  placeholder="Add recipients..."
                  contactGroups={contactGroups}
                  onAddGroup={(emailAddresses) => addGroupToField(emailAddresses, setToEmails)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">CC</label>
                <EmailRecipientInput
                  emails={ccEmails}
                  onEmailsChange={setCcEmails}
                  allContacts={allContacts}
                  placeholder="Add CC recipients..."
                  contactGroups={contactGroups}
                  onAddGroup={(emailAddresses) => addGroupToField(emailAddresses, setCcEmails)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">BCC</label>
                <EmailRecipientInput
                  emails={bccEmails}
                  onEmailsChange={setBccEmails}
                  allContacts={allContacts}
                  placeholder="Add BCC recipients..."
                  contactGroups={contactGroups}
                  onAddGroup={(emailAddresses) => addGroupToField(emailAddresses, setBccEmails)}
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Subject *</label>
                <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="clay-element h-9 text-sm border border-gray-200 focus-within:border-indigo-400" />
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Message *</label>
                <div className="h-48 border rounded-md overflow-hidden border-gray-200 focus-within:border-indigo-400">
                  <RichTextEditor
                    ref={editorRef}
                    value={body}
                    onChange={setBody}
                    userPreferences={userPreferences}
                    className="h-full text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => setShowSignatureEditor(true)} className="h-7 px-3 text-xs">
                  <Signature className="w-3 h-3 mr-1" /> Edit Signature
                </Button>
                <Button variant="outline" size="sm" onClick={handleAddSignature} className="h-7 px-3 text-xs">
                  <Signature className="w-3 h-3 mr-1" /> Add Signature
                </Button>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center transition-all duration-200 hover:border-indigo-400 hover:bg-indigo-50"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1">
                    <Paperclip className="w-4 h-4 mx-auto text-gray-400" />
                    <p className="text-xs text-gray-500">Drag files here or click to browse (Max 25MB)</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-6 px-2 text-xs"
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Browse Files'}
                    </Button>
                  </div>
                  <input type="file" ref={fileInputRef} multiple onChange={(e) => uploadFiles(Array.from(e.target.files))} className="hidden" />
                </div>
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <Badge key={index} className="flex justify-between items-center text-xs px-2 py-1">
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <button onClick={() => removeAttachment(index)} className="ml-2 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden m-0">
              {selectedEmail ? (
                // Email Detail View
                <div className="p-4 space-y-3 h-full overflow-y-auto">
                  <Button onClick={() => setSelectedEmail(null)} variant="outline" size="sm" className="mb-4 h-7 px-3 text-xs">Back to History</Button>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-base">{selectedEmail.subject}</h4>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:bg-red-100" onClick={() => handleDeleteEmail(selectedEmail.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>From:</strong> {selectedEmail.from_address}</p>
                    <p><strong>To:</strong> {selectedEmail.to_addresses?.join(', ')}</p>
                    {selectedEmail.cc_addresses?.length > 0 && <p><strong>CC:</strong> {selectedEmail.cc_addresses.join(', ')}</p>}
                    {selectedEmail.bcc_addresses?.length > 0 && <p><strong>BCC:</strong> {selectedEmail.bcc_addresses.join(', ')}</p>}
                    <p><strong>Sent:</strong> {format(new Date(selectedEmail.sent_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3 text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="mt-4 border-t border-gray-200 pt-3">
                      <p className="font-medium text-sm mb-2">Attachments:</p>
                      <div className="space-y-1">
                        {selectedEmail.attachments.map((attachmentUrl, index) => {
                          const fileName = attachmentUrl.split('/').pop();
                          return (
                            <a
                              key={index}
                              href={attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                            >
                              <Download className="w-3 h-3" /> {fileName}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Email List View with Swipe-to-Delete
                <div className="h-full overflow-y-auto">
                  {emails.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">No email history yet</p>
                    </div>
                  ) : (
                    <div key={emailUpdateTrigger}> {/* Add key to force re-render on trigger */}
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
                </div>
              )}
            </TabsContent>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 flex-shrink-0">
              {activeTab === 'compose' ? (
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-sm"
                  onClick={handleSendEmail}
                  disabled={sending || !selectedTransaction || toEmails.length === 0 || !subject || !body || !user?.is_gmail_connected}
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending via Gmail...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Send via Gmail
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-center text-sm text-gray-500">{emails.length} emails in history</div>
              )}
            </div>
          </Tabs>
        )}
      </div>

      {/* Email Signature Editor Modal */}
      {showSignatureEditor && (
        <div className="fixed inset-0 bg-black/50 z-[100002] flex items-center justify-center p-4">
          <EmailSignatureEditor onClose={() => setShowSignatureEditor(false)} />
        </div>
      )}
    </>
  );
}
