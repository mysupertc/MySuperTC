"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, User, Building, Briefcase, Search, UserPlus } from "lucide-react"
import { Contact, Client } from "@/lib/api/entities"

const CONTACT_TYPES = {
  seller: { label: "Seller", icon: User, fields: ["name", "email", "cell_phone", "office_phone", "notes"] },
  buyer: { label: "Buyer", icon: User, fields: ["name", "email", "cell_phone", "office_phone", "notes"] },
  seller_agent: {
    label: "Seller's Agent",
    icon: Briefcase,
    fields: ["name", "dre_number", "email", "cell_phone", "office_phone", "address", "website", "notes"],
  },
  seller_brokerage: {
    label: "Seller's Brokerage",
    icon: Building,
    fields: ["name", "dre_number", "email", "cell_phone", "office_phone", "address", "website", "notes"],
  },
  buyer_agent: {
    label: "Buyer's Agent",
    icon: Briefcase,
    fields: ["name", "dre_number", "email", "cell_phone", "office_phone", "address", "website", "notes"],
  },
  buyer_brokerage: {
    label: "Buyer's Brokerage",
    icon: Building,
    fields: ["name", "dre_number", "email", "cell_phone", "office_phone", "address", "website", "notes"],
  },
  escrow: {
    label: "Escrow",
    icon: Building,
    fields: ["name", "email", "team_email", "cell_phone", "office_phone", "address", "website"],
  },
  title: {
    label: "Title",
    icon: Building,
    fields: ["name", "email", "team_email", "cell_phone", "office_phone", "address", "website"],
  },
  lender: {
    label: "Lender",
    icon: Building,
    fields: ["name", "email", "team_email", "cell_phone", "office_phone", "address", "website"],
  },
  misc: { label: "Misc.", icon: User, fields: ["name", "email", "cell_phone", "notes"] },
}

const FIELD_LABELS = {
  name: "Name",
  dre_number: "DRE#",
  email: "Email",
  team_email: "Team Email",
  cell_phone: "C: Phone",
  office_phone: "O: Phone",
  address: "Address",
  website: "Website",
  notes: "Notes",
}

// --- START: STABLE, DEBOUNCED GENERIC INPUT ---
const DebouncedInput = ({ value, onChange, type = "text", ...props }) => {
  const [localValue, setLocalValue] = useState(value)
  const debounceTimeout = useRef(null)

  useEffect(() => {
    // Only update localValue if the prop value is different from the current localValue
    // This prevents resetting the input field while the user is typing,
    // but ensures the input reflects external changes to the 'value' prop.
    if (value !== localValue) {
      setLocalValue(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      onChange(newValue)
    }, 500)
  }

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  return <Input {...props} type={type} value={localValue || ""} onChange={handleChange} />
}
// --- END: STABLE, DEBOUNCED GENERIC INPUT ---

export default function Contacts({ contacts, transactionId, onUpdate, isCreationMode = false, onContactsChange }) {
  const [newContact, setNewContact] = useState({ contact_type: "seller" })
  const [isAdding, setIsAdding] = useState(false)
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [globalContacts, setGlobalContacts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!isCreationMode) {
      loadGlobalContacts()
    }
  }, [isCreationMode])

  const loadGlobalContacts = async () => {
    try {
      const [allContacts, allClients] = await Promise.all([Contact.list(), Client.list()])

      // Combine and format all contacts for selection
      const combined = [
        ...allContacts.map((contact) => ({
          ...contact,
          type: "contact",
          displayName: `${contact.name} (${CONTACT_TYPES[contact.contact_type]?.label || contact.contact_type})`,
        })),
        ...allClients.map((client) => ({
          ...client,
          type: "client",
          displayName: `${client.name} (${client.client_type === "buyer" ? "Buyer" : client.client_type === "seller" ? "Seller" : "Both"})`,
          // Map client type to contact type for consistency
          contact_type: client.client_type === "buyer" ? "buyer" : "seller",
        })),
      ]

      setGlobalContacts(combined)
    } catch (error) {
      console.error("Error loading global contacts:", error)
    }
  }

  const filteredGlobalContacts = globalContacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleUpdateContact = useCallback(
    async (contact, field, value) => {
      if (isCreationMode) {
        const updatedContacts = contacts.map((c) => (c.id === contact.id ? { ...c, [field]: value } : c))
        onContactsChange(updatedContacts)
      } else {
        await Contact.update(contact.id, { ...contact, [field]: value })
        onUpdate()
      }
    },
    [isCreationMode, contacts, onContactsChange, onUpdate],
  )

  const handleAddNewContact = useCallback(async () => {
    if (!newContact.name) return

    if (isCreationMode) {
      const contactWithId = { ...newContact, id: Date.now().toString() } // Assign a temporary unique ID
      onContactsChange([...contacts, contactWithId])
    } else {
      await Contact.create({ ...newContact, transaction_id: transactionId })
      onUpdate()
    }

    setNewContact({ contact_type: "seller" })
    setIsAdding(false)
  }, [newContact, isCreationMode, contacts, onContactsChange, transactionId, onUpdate])

  const handleSelectGlobalContact = async (selectedContact) => {
    // This function will only be called if not in creation mode, due to conditional rendering of the button.
    // Create a new contact for this transaction based on the selected global contact
    const contactData = {
      transaction_id: transactionId,
      contact_type: selectedContact.contact_type,
      name: selectedContact.name,
      email: selectedContact.email,
      cell_phone: selectedContact.cell_phone,
      office_phone: selectedContact.office_phone,
      dre_number: selectedContact.dre_number,
      team_email: selectedContact.team_email,
      address: selectedContact.address,
      website: selectedContact.website,
      notes: selectedContact.notes,
    }

    await Contact.create(contactData)
    setShowContactSelector(false)
    setSearchTerm("")
    onUpdate()
  }

  const handleDeleteContact = async (contactId) => {
    if (isCreationMode) {
      const updatedContacts = contacts.filter((c) => c.id !== contactId)
      onContactsChange(updatedContacts)
    } else {
      await Contact.delete(contactId)
      onUpdate()
    }
  }

  return (
    <Card className="clay-element border-0">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Contacts</span>
          <div className="flex gap-2">
            {!isCreationMode && (
              <Button
                onClick={() => setShowContactSelector(true)}
                variant="outline"
                size="sm"
                className="clay-element border-0"
              >
                <Search className="w-4 h-4 mr-2" />
                Add Existing
              </Button>
            )}
            <Button onClick={() => setIsAdding(true)} variant="outline" size="sm" className="clay-element border-0">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Contact Selector */}
        {showContactSelector && (
          <div className="clay-element p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Select Existing Contact</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactSelector(false)}
                className="clay-element border-0"
              >
                Cancel
              </Button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 clay-element border-0"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filteredGlobalContacts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No contacts found</p>
              ) : (
                filteredGlobalContacts.map((contact) => (
                  <div
                    key={`${contact.type}-${contact.id}`}
                    onClick={() => handleSelectGlobalContact(contact)}
                    className="p-3 clay-element hover:shadow-lg cursor-pointer transition-all rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {contact.name?.charAt(0) || "C"}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{contact.displayName}</p>
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Existing Contact Sections */}
        {Object.entries(CONTACT_TYPES).map(([typeKey, typeInfo]) => {
          const sectionContacts = contacts.filter((c) => c.contact_type === typeKey)
          if (sectionContacts.length === 0 && (!isAdding || newContact.contact_type !== typeKey)) return null

          return (
            <div key={typeKey}>
              <h3 className="font-semibold text-lg mb-3 text-gray-800 flex items-center gap-2">
                <typeInfo.icon className="w-5 h-5" />
                {typeInfo.label}
              </h3>
              <div className="space-y-4">
                {sectionContacts.map((contact) => (
                  <div key={contact.id} className="clay-element p-4 rounded-lg space-y-2 relative group">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteContact(contact.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                    {typeInfo.fields.map((field) => (
                      <div key={field} className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-sm text-gray-500">{FIELD_LABELS[field]}</label>
                        <DebouncedInput
                          value={contact[field] || ""}
                          onChange={(value) => handleUpdateContact(contact, field, value)}
                          className="col-span-2 clay-element border-0 bg-transparent text-sm p-1"
                        />
                      </div>
                    ))}
                  </div>
                ))}

                {isAdding && newContact.contact_type === typeKey && (
                  <div className="clay-element p-4 rounded-lg space-y-2">
                    {CONTACT_TYPES[newContact.contact_type].fields.map((field) => (
                      <div key={field} className="grid grid-cols-3 gap-2 items-center">
                        <label className="text-sm text-gray-500">{FIELD_LABELS[field]}</label>
                        <DebouncedInput
                          placeholder={`New ${FIELD_LABELS[field]}...`}
                          value={newContact[field] || ""}
                          onChange={(value) => setNewContact((prev) => ({ ...prev, [field]: value }))}
                          className="col-span-2 clay-element border-0 text-sm p-1"
                        />
                      </div>
                    ))}
                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        onClick={handleAddNewContact}
                        size="sm"
                        className="clay-element clay-accent-mint border-0"
                      >
                        Save
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAdding(false)}
                        className="clay-element border-0"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {isAdding && (
          <div className="clay-element p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-lg">Add New Contact</h4>
            <Select value={newContact.contact_type} onValueChange={(v) => setNewContact({ contact_type: v })}>
              <SelectTrigger className="clay-element border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="clay-element border-0">
                {Object.entries(CONTACT_TYPES).map(([key, val]) => (
                  <SelectItem key={key} value={key}>
                    {val.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
