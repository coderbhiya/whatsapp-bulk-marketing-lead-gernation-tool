'use client';

import { Plus, X, Edit2, Trash2, Image as ImageIcon, CheckCircle, XCircle, AlertTriangle, Sparkles, Crown } from 'lucide-react';
import { useEffect, useState } from 'react';
import UpgradeModal from '@/components/UpgradeModal';

type Campaign = {
  id: string;
  name: string;
  status: string;
  targetGroup: string | null;
  message: string;
  mediaUrl: string | null;
  successfulCount: number;
  failedCount: number;
  createdAt: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ plan: string; sentMessagesCount: number } | null>(null);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [newCampaign, setNewCampaign] = useState({ name: '', targetGroup: '', message: '', mediaUrl: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uniqueGroups, setUniqueGroups] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCampaignsAndGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [campaignsRes, contactsRes, userRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacts`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { headers })
      ]);

      if (campaignsRes.ok) setCampaigns(await campaignsRes.json());
      if (contactsRes.ok) {
        const contacts = await contactsRes.json();
        const groups = Array.from(new Set(contacts.map((c: any) => c.group).filter(Boolean))) as string[];
        setUniqueGroups(groups);
      }
      if (userRes.ok) {
        setUserProfile(await userRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndGroups();
  }, []);

  const handleRunCampaign = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}/run`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCampaignsAndGroups();
      } else {
        const errorData = await res.json();
        if (res.status === 403 || errorData.error?.includes('limit')) {
          setIsUpgradeModalOpen(true);
        } else {
          alert(errorData.error || 'Failed to run campaign');
        }
      }
    } catch (error) {
      console.error('Failed to run campaign:', error);
      alert('Failed to run campaign');
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      let finalMediaUrl = newCampaign.mediaUrl;

      // Handle file upload first if there's a selected file
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalMediaUrl = uploadData.url;
        } else {
          alert('Failed to upload media');
          setIsSaving(false);
          return;
        }
      }

      const url = editingCampaignId
        ? `${process.env.NEXT_PUBLIC_API_URL}/campaigns/${editingCampaignId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/campaigns`;

      const payload = {
        ...newCampaign,
        mediaUrl: finalMediaUrl || undefined
      };

      const res = await fetch(url, {
        method: editingCampaignId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        closeModal();
        fetchCampaignsAndGroups(); // Refresh list
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save campaign');
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (campaign: Campaign) => {
    setNewCampaign({
      name: campaign.name,
      targetGroup: campaign.targetGroup || '',
      message: campaign.message,
      mediaUrl: campaign.mediaUrl || ''
    });
    setSelectedFile(null);
    setEditingCampaignId(campaign.id);
    setIsModalOpen(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCampaignsAndGroups();
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCampaignId(null);
    setNewCampaign({ name: '', targetGroup: '', message: '', mediaUrl: '' });
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const isFreePlan = userProfile?.plan === 'FREE';
  const sentCount = userProfile?.sentMessagesCount || 0;
  const isLimitReached = isFreePlan && sentCount >= 5;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your outreach, attach media, and track engagement.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCampaignsAndGroups} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
            Refresh
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </header>

      {/* Free Plan Message Limit Banner */}
      {isFreePlan && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 shadow-sm ${isLimitReached
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-900'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLimitReached ? 'bg-amber-500 text-white' : 'bg-[#25D366] text-white'
              }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {isLimitReached
                  ? 'Free Message Limit Reached (5/5 Messages Sent)'
                  : `Free Plan Quota: ${sentCount} of 5 free messages used`}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {isLimitReached
                  ? 'Upgrade to PRO Plan for ₹99 to send unlimited bulk messages & campaigns.'
                  : `You have ${5 - sentCount} free messages left. Upgrade to PRO for unlimited messages.`}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 whitespace-nowrap transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade for ₹99
          </button>
        </div>
      )}

      {/* Add/Edit Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled={isSaving}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingCampaignId ? 'Edit Campaign' : 'Create New Campaign'}
            </h2>
            <form onSubmit={handleSaveCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <input required type="text" className="input" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Q3 Newsletter" disabled={isSaving} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Groups</label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 bg-gray-50/50">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-medium border-b pb-2 mb-1">
                    <input
                      type="checkbox"
                      checked={!newCampaign.targetGroup}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCampaign({ ...newCampaign, targetGroup: '' });
                        }
                      }}
                      className="rounded text-green-600 focus:ring-green-500"
                      disabled={isSaving}
                    />
                    All Contacts (No Filter)
                  </label>
                  {uniqueGroups.map((group) => {
                    const selectedGroups = newCampaign.targetGroup ? newCampaign.targetGroup.split(',').map(g => g.trim()) : [];
                    const isChecked = selectedGroups.includes(group);
                    return (
                      <label key={group} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            let updated: string[];
                            if (e.target.checked) {
                              updated = [...selectedGroups, group];
                            } else {
                              updated = selectedGroups.filter(g => g !== group);
                            }
                            setNewCampaign({ ...newCampaign, targetGroup: updated.join(', ') });
                          }}
                          className="rounded text-green-600 focus:ring-green-500"
                          disabled={isSaving}
                        />
                        {group}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select one or multiple groups, or choose "All Contacts".</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                <textarea required className="input min-h-[100px]" value={newCampaign.message} onChange={e => setNewCampaign({ ...newCampaign, message: e.target.value })} placeholder="Hello {{name}}! We have a special offer for you..." disabled={isSaving}></textarea>
                <p className="text-xs text-gray-500 mt-1">Use <code>{`{{name}}`}</code> to personalize the message.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" /> Media Attachment (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors"
                  disabled={isSaving}
                />
                {newCampaign.mediaUrl && !selectedFile && (
                  <p className="text-xs text-green-600 mt-1">Current media attached.</p>
                )}
                {selectedFile && (
                  <p className="text-xs text-blue-600 mt-1">Selected: {selectedFile.name}</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full mt-4 flex justify-center items-center gap-2" disabled={isSaving}>
                {isSaving ? 'Saving...' : (editingCampaignId ? 'Save Changes' : 'Save Campaign')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Campaign Name</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Stats</th>
                <th className="px-6 py-3 font-medium">Target Group</th>
                <th className="px-6 py-3 font-medium">Date Created</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading campaigns...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No campaigns found. Create one to get started!</td></tr>
              ) : campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                    {camp.name}
                    {camp.mediaUrl && <span title="Has media attachment"><ImageIcon className="w-4 h-4 text-green-500" /></span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${camp.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                        camp.status === 'RUNNING' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          camp.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(camp.successfulCount > 0 || camp.failedCount > 0 || camp.status === 'COMPLETED' || camp.status === 'FAILED') ? (
                      <div className="flex gap-3 text-xs">
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> {camp.successfulCount}</span>
                        <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3 h-3" /> {camp.failedCount}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{camp.targetGroup || 'All Contacts'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(camp.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 flex gap-2 items-center">
                    {camp.status === 'PENDING' && (
                      <button onClick={() => handleRunCampaign(camp.id)} className="text-green-600 font-medium hover:underline text-sm mr-2">
                        Run
                      </button>
                    )}
                    {camp.status === 'PENDING' && (
                      <button onClick={() => handleEditClick(camp)} className="text-green-600 hover:text-green-800 p-1 bg-green-50 rounded-md transition-colors" title="Edit Campaign">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteCampaign(camp.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded-md transition-colors" title="Delete Campaign">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </div>
  );
}
