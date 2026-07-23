'use client';

import { Plus, Search, Filter, X, Upload, Edit2, Trash2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

type Contact = {
  id: string;
  name: string;
  phone: string;
  group: string | null;
  createdAt: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '', group: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingContactId
        ? `${process.env.NEXT_PUBLIC_API_URL}/contacts/${editingContactId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/contacts`;

      const res = await fetch(url, {
        method: editingContactId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newContact)
      });
      if (res.ok) {
        closeModal();
        fetchContacts(); // Refresh list
      }
    } catch (error) {
      console.error('Failed to save contact:', error);
    }
  };

  const handleEditClick = (contact: Contact) => {
    setNewContact({ name: contact.name, phone: contact.phone, group: contact.group || '' });
    setEditingContactId(contact.id);
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContactId(null);
    setNewContact({ name: '', phone: '', group: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const rows = text.split('\n').map(row => row.trim()).filter(row => row);
      if (rows.length < 2) {
        alert('CSV must contain headers and at least one contact.');
        return;
      }

      const headers = rows[0].toLowerCase().split(',').map(h => h.trim());
      const nameIdx = headers.indexOf('name');
      const phoneIdx = headers.indexOf('phone');
      const groupIdx = headers.indexOf('group');

      if (nameIdx === -1 || phoneIdx === -1) {
        alert('CSV must contain "name" and "phone" columns.');
        return;
      }

      const bulkContacts = rows.slice(1).map(row => {
        const cols = row.split(',').map(c => c.trim());
        return {
          name: cols[nameIdx],
          phone: cols[phoneIdx],
          group: groupIdx !== -1 ? cols[groupIdx] : ''
        };
      }).filter(c => c.name && c.phone);

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ contacts: bulkContacts })
        });

        if (res.ok) {
          const data = await res.json();
          alert(`Successfully imported ${data.count} contacts!`);
          fetchContacts();
        } else {
          alert('Failed to import contacts.');
        }
      } catch (error) {
        console.error('Bulk import error:', error);
        alert('Error importing contacts.');
      }

      // Reset input so you can select the same file again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your CRM audience and groups.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/sample_contacts.csv" download className="text-xs text-green-600 hover:underline mr-2">
            Sample CSV
          </a>
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </header>

      {/* Add/Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingContactId ? 'Edit Contact' : 'Add Contact'}
            </h2>

            <form onSubmit={handleSaveContact} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" className="input" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="text" className="input" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+1234567890" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group (Optional)</label>
                <input type="text" className="input" value={newContact.group} onChange={e => setNewContact({ ...newContact, group: e.target.value })} placeholder="VIP Customers" />
              </div>
              <button type="submit" className="btn-primary w-full mt-4">
                {editingContactId ? 'Save Changes' : 'Save Single Contact'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-white items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts..."
              className="pl-9 pr-4 py-1.5 w-full bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <select className="pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none font-medium">
              <option>All Groups</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Group</th>
                <th className="px-6 py-3 font-medium">Date Added</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading contacts...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No contacts found. Add one to get started!</td></tr>
              ) : contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{contact.name}</td>
                  <td className="px-6 py-4 text-gray-600">{contact.phone}</td>
                  <td className="px-6 py-4">
                    {contact.group ? (
                      <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                        {contact.group}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleEditClick(contact)} className="text-green-600 hover:text-green-800 p-1 bg-green-50 rounded-md transition-colors" title="Edit Contact">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteContact(contact.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded-md transition-colors" title="Delete Contact">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
