'use client';

import { useEffect, useState } from 'react';
import { Users, Zap, BarChart3, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string, email: string } | null>(null);
  const [stats, setStats] = useState({ totalContacts: 0, activeCampaigns: 0 });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        const [contactsRes, campaignsRes] = await Promise.all([
          fetch('https://apibulkping.senseforge.in/api/contacts', { headers }),
          fetch('https://apibulkping.senseforge.in/api/campaigns', { headers })
        ]);

        if (contactsRes.ok && campaignsRes.ok) {
          const contacts = await contactsRes.json();
          const campaigns = await campaignsRes.json();

          const activeCampaigns = campaigns.filter((c: any) => c.status === 'RUNNING' || c.status === 'PENDING').length;

          setStats({
            totalContacts: contacts.length,
            activeCampaigns
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  if (!user) return <div className="animate-pulse text-gray-500 text-sm">Loading workspace...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Welcome, {user.name}</h1>
        <p className="text-gray-500 text-sm mt-1">Here's what's happening with your workspace today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Contacts</h3>
            <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.totalContacts}</p>
          <div className="mt-2 flex items-center text-xs font-medium text-green-600">
            <span>Dynamic</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
            <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">{stats.activeCampaigns}</p>
          <div className="mt-2 flex items-center text-xs font-medium text-gray-500">
            <span>Pending or Running</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Engagement Rate</h3>
            <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center text-green-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900">--%</p>
          <div className="mt-2 flex items-center text-xs font-medium text-gray-500">
            <span>Tracking coming soon</span>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center mt-1">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Campaign "Q3 Marketing" finished</p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
