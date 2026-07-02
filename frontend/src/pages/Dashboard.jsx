import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiFetch, { BACKEND_URL } from '../utils/api';
import { QRCodeSVG } from 'qrcode.react';

const downloadSVG = (svgId, fileName) => {
  const svgEl = document.getElementById(svgId);
  if (!svgEl) return;
  const svgXml = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadPNG = (svgId, fileName) => {
  const svgEl = document.getElementById(svgId);
  if (!svgEl) return;
  const svgXml = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Draw white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw SVG image
    ctx.drawImage(img, 20, 20, 260, 260);
    
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  img.src = url;
};
import { 
  Link2, Plus, Search, Trash2, Edit3, BarChart2, QrCode, 
  Calendar, FileText, Layers, Copy, Check, ExternalLink, 
  X, AlertCircle, ChevronDown, CheckCircle, RefreshCw
} from 'lucide-react';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Single Shorten Form State
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bulk Shorten Form State
  const [bulkText, setBulkText] = useState('');
  const [bulkResults, setBulkResults] = useState(null);
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'

  // Search/Sort/Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc'); // 'createdAt_desc', 'createdAt_asc', 'clicks_desc', 'clicks_asc'

  // Modal / Drawer States
  const [activeQrId, setActiveQrId] = useState(null);
  const [editLink, setEditLink] = useState(null);
  const [editOriginalUrl, setEditOriginalUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [editing, setEditing] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch all user URLs
  const fetchLinks = async () => {
    try {
      setError('');
      const data = await apiFetch('/urls');
      if (data.success) {
        setLinks(data.data);
      }
    } catch (err) {
      setError('Failed to load links.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // Handle single shorten submit
  const handleSingleShorten = async (e) => {
    e.preventDefault();
    if (!originalUrl) return;

    setSubmitting(true);
    setError('');

    try {
      const payload = { originalUrl };
      if (customAlias) payload.customAlias = customAlias;
      if (title) payload.title = title;
      if (expiresAt) payload.expiresAt = expiresAt;

      const data = await apiFetch('/urls/shorten', {
        method: 'POST',
        body: payload
      });

      if (data.success) {
        // Reset form
        setOriginalUrl('');
        setCustomAlias('');
        setTitle('');
        setExpiresAt('');
        // Refresh link list
        fetchLinks();
      }
    } catch (err) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle bulk shorten submit
  const handleBulkShorten = async (e) => {
    e.preventDefault();
    if (!bulkText) return;

    setSubmitting(true);
    setError('');
    setBulkResults(null);

    // Parse textarea line-by-line: url, [alias], [title]
    const lines = bulkText.split('\n').filter(line => line.trim() !== '');
    const linksArray = lines.map(line => {
      const parts = line.split(',');
      const originalUrl = parts[0]?.trim();
      const customAlias = parts[1]?.trim() || '';
      const title = parts[2]?.trim() || originalUrl;
      return { originalUrl, customAlias, title };
    });

    try {
      const data = await apiFetch('/urls/bulk', {
        method: 'POST',
        body: { links: linksArray }
      });

      if (data.success) {
        setBulkResults(data);
        setBulkText('');
        fetchLinks();
      }
    } catch (err) {
      setError(err.message || 'Failed to process bulk URLs');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Link Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editLink) return;

    setEditing(true);
    try {
      const data = await apiFetch(`/urls/${editLink._id}`, {
        method: 'PUT',
        body: {
          originalUrl: editOriginalUrl,
          title: editTitle,
          description: editDescription,
          expiresAt: editExpiresAt || null
        }
      });

      if (data.success) {
        setEditLink(null);
        fetchLinks();
      }
    } catch (err) {
      alert(err.message || 'Failed to update link');
    } finally {
      setEditing(false);
    }
  };

  // Handle Link Delete
  const handleDeleteLink = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortened URL and all of its analytics?')) {
      return;
    }

    try {
      const data = await apiFetch(`/urls/${id}`, {
        method: 'DELETE'
      });
      if (data.success) {
        setLinks(links.filter(link => link._id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete link');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Format local date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Open Edit Modal
  const openEditModal = (link) => {
    setEditLink(link);
    setEditOriginalUrl(link.originalUrl);
    setEditTitle(link.title || '');
    setEditDescription(link.description || '');
    setEditExpiresAt(link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '');
  };

  // Filter & Sort Links
  const filteredLinks = links
    .filter(link => {
      const query = searchQuery.toLowerCase();
      return (
        link.title?.toLowerCase().includes(query) ||
        link.originalUrl.toLowerCase().includes(query) ||
        link.shortCode.toLowerCase().includes(query) ||
        link.customAlias?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'createdAt_desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'createdAt_asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'clicks_desc') return (b.clicks || 0) - (a.clicks || 0);
      if (sortBy === 'clicks_asc') return (a.clicks || 0) - (b.clicks || 0);
      return 0;
    });

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      
      {/* Header Info */}
      <header className="flex-between mb-8" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '32px', margin: 0, fontWeight: '800' }} className="gradient-text">
            Welcome, {user?.name || 'User'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
            Manage your shortened links and monitor real-time traffic
          </p>
        </div>
        <button onClick={logout} className="btn btn-secondary btn-sm">
          Sign Out
        </button>
      </header>

      {/* Creation Area */}
      <div className="glass-panel mb-8" style={{ padding: '24px' }}>
        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', marginBottom: '24px', gap: '24px' }}>
          <button 
            onClick={() => setActiveTab('single')} 
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '16px', fontWeight: '600', padding: '12px 4px', cursor: 'pointer',
              borderBottom: activeTab === 'single' ? '2px solid var(--accent-indigo)' : 'none',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Link2 size={16} /> Shorten Single Link
          </button>
          <button 
            onClick={() => setActiveTab('bulk')} 
            style={{ 
              background: 'none', border: 'none', color: activeTab === 'bulk' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '16px', fontWeight: '600', padding: '12px 4px', cursor: 'pointer',
              borderBottom: activeTab === 'bulk' ? '2px solid var(--accent-indigo)' : 'none',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Layers size={16} /> Bulk Shorten Links
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#fda4af', fontSize: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Single Shortener Form */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleShorten}>
            <div className="form-group">
              <label className="form-label">Destination URL</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., https://example.com/long-page-path/resource"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Custom Alias (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., my-special-link"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value)}
                  disabled={submitting}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Title / Label (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Project Launch Document"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group">
                <label className="form-label">Expiration Date (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    disabled={submitting}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div className="form-group" style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }} disabled={submitting}>
                  <Plus size={18} /> {submitting ? 'Shortening...' : 'Create Link'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Bulk Shortener Form */}
        {activeTab === 'bulk' && (
          <form onSubmit={handleBulkShorten}>
            <div className="form-group">
              <label className="form-label">Bulk Links List (One per line)</label>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Format: <code>long_url, [custom_alias], [optional_title]</code>
              </div>
              <textarea
                className="form-control"
                rows="5"
                placeholder="https://example.com/one, promo-one, Promo Landing&#10;https://example.com/two, promo-two, Promo Signup&#10;https://example.com/three"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                disabled={submitting}
                style={{ resize: 'vertical', fontFamily: 'var(--mono)', fontSize: '14px' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }} disabled={submitting}>
              {submitting ? 'Processing Bulk Links...' : 'Shorten List'}
            </button>

            {bulkResults && (
              <div className="animate-fade-in" style={{ marginTop: '24px', background: 'rgba(0, 0, 0, 0.02)', padding: '20px', borderRadius: '12px', border: '1px solid var(--panel-border)', textAlign: 'left' }}>
                <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={18} style={{ color: 'var(--accent-emerald)' }} /> Bulk processing complete
                </h4>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Successfully processed {bulkResults.processed} links. Created {bulkResults.successCount} links. Failed: {bulkResults.errorCount}.
                </div>
                {bulkResults.data.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' }}>
                    {bulkResults.data.map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0, 0, 0, 0.03)', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', alignItems: 'center' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', maxWidth: '300px' }}>{r.originalUrl}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ color: 'var(--accent-indigo)', fontWeight: '600' }}>{`${BACKEND_URL}/r/${r.shortCode}`}</span>
                          <button type="button" className="btn btn-secondary btn-sm" style={{ padding: '4px' }} onClick={() => copyToClipboard(`${BACKEND_URL}/r/${r.shortCode}`, `bulk_${i}`)}>
                            {copiedId === `bulk_${i}` ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {bulkResults.errors.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid rgba(244, 63, 94, 0.2)', paddingTop: '12px' }}>
                    <div style={{ color: '#f87171', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Failed URL Details:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                      {bulkResults.errors.map((e, i) => (
                        <div key={i} style={{ color: '#fda4af', fontSize: '12px' }}>
                          Line {e.index + 1}: {e.originalUrl || 'Missing URL'} - <strong>{e.message}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Search and Sort Filter Pipelines */}
      <section className="flex-between mb-4" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search links..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '40px', height: '40px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '320px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ height: '40px', paddingRight: '36px', appearance: 'none', cursor: 'pointer' }}
            >
              <option value="createdAt_desc">Newest Created</option>
              <option value="createdAt_asc">Oldest Created</option>
              <option value="clicks_desc">Most Clicked</option>
              <option value="clicks_asc">Least Clicked</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          </div>
          <button onClick={fetchLinks} className="btn btn-secondary" style={{ padding: '8px 12px', height: '40px' }} title="Refresh Links">
            <RefreshCw size={16} />
          </button>
        </div>
      </section>

      {/* URL Grid List */}
      {loading ? (
        <div className="text-center" style={{ padding: '60px' }}>
          <div style={{ border: '3px solid rgba(255, 255, 255, 0.1)', borderTop: '3px solid var(--accent-indigo)', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading shortened links...</p>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '60px 24px' }}>
          <Link2 size={36} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No links found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {searchQuery ? 'Try matching another search keyword.' : 'Get started by creating your first shortened link above!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredLinks.map((link) => {
            const shortUrlStr = `${BACKEND_URL}/r/${link.shortCode}`;
            return (
              <div key={link._id} className="glass-panel animate-fade-in" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {link.title || link.originalUrl}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                      Destination: <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>{link.originalUrl} <ExternalLink size={11} style={{ display: 'inline' }} /></a>
                    </p>
                  </div>
                  
                  {/* Click Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '13px', padding: '6px 12px' }}>
                      <strong>{link.clicks || 0}</strong> &nbsp;clicks
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--panel-border)', paddingTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
                  
                  {/* Short Link Output */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.02)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <a href={shortUrlStr} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-indigo)', fontWeight: '700', fontSize: '15px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {shortUrlStr}
                    </a>
                    <button onClick={() => copyToClipboard(shortUrlStr, link._id)} className="btn btn-secondary btn-sm" style={{ padding: '6px', minWidth: 'auto', background: 'none', border: 'none' }} title="Copy link">
                      {copiedId === link._id ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => setActiveQrId(activeQrId === link._id ? null : link._id)} className="btn btn-secondary btn-sm" style={{ padding: '6px', minWidth: 'auto', background: 'none', border: 'none' }} title="Show QR Code">
                      <QrCode size={14} style={{ color: activeQrId === link._id ? 'var(--accent-indigo)' : 'var(--text-secondary)' }} />
                    </button>
                  </div>

                  {/* Actions (Analytics, Edit, Delete, Expiry) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {link.expiresAt && (
                      <span style={{ fontSize: '12px', color: new Date(link.expiresAt) < new Date() ? '#f87171' : 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {new Date(link.expiresAt) < new Date() ? 'Expired' : `Expires: ${new Date(link.expiresAt).toLocaleDateString()}`}
                      </span>
                    )}

                    <Link to={`/analytics/${link._id}`} className="btn btn-secondary btn-sm">
                      <BarChart2 size={14} /> Analytics
                    </Link>
                    <button onClick={() => openEditModal(link)} className="btn btn-secondary btn-sm" title="Edit Link">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteLink(link._id)} className="btn btn-secondary btn-sm" style={{ color: '#fda4af' }} title="Delete Link">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* QR Code Expansion */}
                {activeQrId === link._id && (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', background: 'rgba(0,0,0,0.01)', borderRadius: '8px', border: '1px solid var(--panel-border)', marginTop: '8px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'inline-block' }}>
                      <QRCodeSVG id={`qr-${link._id}`} value={shortUrlStr} size={160} level="H" includeMargin={true} />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '12px' }}>
                      Scan QR code to visit short link
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => downloadSVG(`qr-${link._id}`, `qr-${link.shortCode}`)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Download SVG
                      </button>
                      <button 
                        onClick={() => downloadPNG(`qr-${link._id}`, `qr-${link.shortCode}`)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Download PNG
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal / Drawer */}
      {editLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', background: '#ffffff', padding: '28px' }}>
            <div className="flex-between mb-4">
              <h3 style={{ fontSize: '20px' }}>Edit Link Details</h3>
              <button onClick={() => setEditLink(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination URL</label>
                <input
                  type="text"
                  className="form-control"
                  value={editOriginalUrl}
                  onChange={(e) => setEditOriginalUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Notes</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="E.g., tracking links for June newsletter"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '28px' }}>
                <label className="form-label">Expiration Date</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={editExpiresAt}
                  onChange={(e) => setEditExpiresAt(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setEditLink(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={editing}>
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spin Animation Keyframes Style */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
