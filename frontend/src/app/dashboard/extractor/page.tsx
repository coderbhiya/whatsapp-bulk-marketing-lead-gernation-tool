'use client';

import { Download, Users, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type Group = {
  id: string;
  name: string;
  participantsCount: number;
};

export default function ExtractorPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/whatsapp/groups`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        setGroups(data);
      } else {
        let errMessage = 'Failed to fetch groups';
        if (contentType && contentType.includes('application/json')) {
          const err = await res.json();
          errMessage = err.error || errMessage;
        } else {
          errMessage = `Server error (${res.status}). Ensure backend is running.`;
        }
        setError(errMessage);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      setError('Connection error. Could not connect to backend API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleExtract = async (groupId: string, groupName: string) => {
    setExtractingId(groupId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/whatsapp/groups/${groupId}/extract`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        alert(`Successfully extracted ${data.extracted} new contacts from ${groupName}!`);
      } else {
        let errMessage = 'Failed to extract contacts';
        if (contentType && contentType.includes('application/json')) {
          const errData = await res.json();
          errMessage = errData.error || errMessage;
        } else {
          errMessage = `Server error (${res.status}).`;
        }
        alert(errMessage);
      }
    } catch (error) {
      console.error('Failed to extract:', error);
      alert('Error extracting contacts');
    } finally {
      setExtractingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Group Extractor</h1>
          <p className="text-gray-500 text-sm mt-1">Extract phone numbers from your WhatsApp groups directly into your CRM.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchGroups} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
            Refresh Groups
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          {error.includes('Settings') && (
            <a href="/dashboard/settings" className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors whitespace-nowrap">
              Go to Settings
            </a>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Group Name</th>
                <th className="px-6 py-3 font-medium">Participants</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Loading your WhatsApp groups...</td></tr>
              ) : groups.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No groups found. Ensure your WhatsApp is linked.</td></tr>
              ) : groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{group.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {group.participantsCount}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleExtract(group.id, group.name)}
                      disabled={extractingId === group.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 hover:border-green-300 font-medium text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {extractingId === group.id ? 'Extracting...' : 'Extract to CRM'}
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
