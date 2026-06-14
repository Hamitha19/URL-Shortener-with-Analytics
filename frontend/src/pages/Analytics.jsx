import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiFetch from '../utils/api';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  ArrowLeft, Calendar, BarChart2, Globe, Laptop, ShieldAlert,
  Clock, Eye, UserCheck, ExternalLink, CalendarDays, RefreshCw
} from 'lucide-react';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#a855f7', '#f43f5e', '#eab308'];

export const Analytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch(`/urls/${id}/analytics`);
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load link analytics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: '100px 24px' }}>
        <div style={{ border: '3px solid rgba(255, 255, 255, 0.1)', borderTop: '3px solid var(--accent-indigo)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading analytics data...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !analyticsData) {
    return (
      <div className="container" style={{ padding: '60px 24px', maxWidth: '600px' }}>
        <div className="glass-panel text-center" style={{ padding: '48px 24px' }}>
          <ShieldAlert size={48} style={{ color: 'var(--accent-rose)', marginBottom: '16px' }} />
          <h2>Failed to load analytics</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '24px' }}>
            {error || 'The analytics details for this link could not be loaded.'}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/dashboard" className="btn btn-secondary">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <button onClick={fetchAnalytics} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { url, clicks, uniqueClicks, timeline, browsers, os, devices, referrers, recentVisits } = analyticsData;
  const shortUrlStr = `http://localhost:5000/r/${url.shortCode}`;

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', margin: 0 }}>
            Clicks: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* Navigation & Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }} className="nav-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex-between" style={{ marginTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '32px', margin: 0, fontWeight: '800' }}>Link Analytics</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px', maxWidth: '680px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Detailed traffic breakdown for <span style={{ color: 'var(--accent-indigo)', fontWeight: '600' }}>{url.title || shortUrlStr}</span>
            </p>
          </div>
          <button onClick={fetchAnalytics} className="btn btn-secondary btn-sm" style={{ display: 'flex', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Target Link Info Glass Box */}
      <div className="glass-panel mb-8" style={{ padding: '20px 24px', borderLeft: '4px solid var(--accent-indigo)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-indigo)', display: 'block', marginBottom: '4px' }}>Shortened Link</span>
            <a href={shortUrlStr} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-indigo)', fontSize: '18px', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {shortUrlStr} <ExternalLink size={14} style={{ color: 'var(--accent-indigo)' }} />
            </a>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '6px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '500px' }}>
              Destination: <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{url.originalUrl}</a>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarDays size={14} /> Created: {new Date(url.createdAt).toLocaleDateString()}
            </span>
            {url.expiresAt && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: new Date(url.expiresAt) < new Date() ? '#f87171' : 'inherit' }}>
                <Clock size={14} /> {new Date(url.expiresAt) < new Date() ? 'Expired' : `Expires: ${new Date(url.expiresAt).toLocaleDateString()}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key Stats Counter Cards */}
      <div className="grid-3 mb-8" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="glass-panel text-center" style={{ padding: '24px' }}>
          <Eye size={24} style={{ color: 'var(--accent-indigo)', marginBottom: '8px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>Total Clicks</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{clicks || 0}</div>
        </div>
        <div className="glass-panel text-center" style={{ padding: '24px' }}>
          <UserCheck size={24} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>Unique Clicks</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>{uniqueClicks || 0}</div>
        </div>
        <div className="glass-panel text-center" style={{ padding: '24px' }}>
          <Clock size={24} style={{ color: 'var(--accent-emerald)', marginBottom: '8px' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600' }}>Avg. Daily Clicks</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
            {timeline.length > 0 ? (clicks / timeline.length).toFixed(1) : clicks}
          </div>
        </div>
      </div>

      {/* Clicks Over Time Chart */}
      <div className="glass-panel mb-8" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
          <BarChart2 size={18} style={{ color: 'var(--accent-indigo)' }} /> Clicks Timeline
        </h3>
        <div style={{ width: '100%', height: '320px' }}>
          {timeline.length === 0 ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No visit timeline records yet. Visit the link to view click trends.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-indigo)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-indigo)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="clicks" stroke="var(--accent-indigo)" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid of Distributions (Referrers, OS, Browser, Devices) */}
      <div className="grid-3 mb-8" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        
        {/* Referrers Distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <Globe size={16} style={{ color: 'var(--accent-indigo)' }} /> Traffic Referrers
          </h3>
          <div style={{ width: '100%', height: '220px', position: 'relative' }}>
            {referrers.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No referrers logged.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={referrers}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {referrers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} clicks`, 'Count']} contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#94a3b8' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Device Distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <Laptop size={16} style={{ color: 'var(--accent-cyan)' }} /> Device Platforms
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            {devices.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No device log history.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={devices} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#94a3b8' }} formatter={(value) => [`${value} clicks`, 'Count']} />
                  <Bar dataKey="value" fill="var(--accent-cyan)" radius={[0, 4, 4, 0]} barSize={20}>
                    {devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Browser Distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <Globe size={16} style={{ color: 'var(--accent-emerald)' }} /> Browser Types
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            {browsers.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No browser data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={browsers} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#94a3b8' }} formatter={(value) => [`${value} clicks`, 'Count']} />
                  <Bar dataKey="value" fill="var(--accent-emerald)" radius={[4, 4, 0, 0]} barSize={24}>
                    {browsers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
            <Laptop size={16} style={{ color: 'var(--accent-purple)' }} /> Operating Systems
          </h3>
          <div style={{ width: '100%', height: '220px' }}>
            {os.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No OS data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={os} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#94a3b8' }} formatter={(value) => [`${value} clicks`, 'Count']} />
                  <Bar dataKey="value" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} barSize={24}>
                    {os.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Recent Activity Log Table */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
          <Clock size={18} style={{ color: 'var(--accent-indigo)' }} /> Recent Visitors Log
        </h3>
        {recentVisits.length === 0 ? (
          <div style={{ padding: '32px', color: 'var(--text-muted)' }}>
            No clicks recorded yet. Click details will appear here as visitors open your shortened link.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Time</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Referrer</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Browser</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>OS</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>Device</th>
                <th style={{ padding: '12px 16px', fontWeight: '600' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {recentVisits.map((visit) => (
                <tr key={visit._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {new Date(visit.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--accent-indigo)', fontWeight: '500' }}>{visit.referrer}</td>
                  <td style={{ padding: '12px 16px' }}>{visit.browser}</td>
                  <td style={{ padding: '12px 16px' }}>{visit.os}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${visit.device === 'Desktop' ? 'badge-indigo' : visit.device === 'Mobile' ? 'badge-emerald' : 'badge-rose'}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {visit.device}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--mono)', color: 'var(--text-secondary)' }}>{visit.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default Analytics;
