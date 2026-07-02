import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Link2, Copy, Check, BarChart2, QrCode, Shield, Zap, Sparkles } from 'lucide-react';
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

export const Home = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [recentLinks, setRecentLinks] = useState([]);
  const [showQr, setShowQr] = useState(false);

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError('');
    setShortUrl('');
    setCopied(false);
    setShowQr(false);

    try {
      const data = await apiFetch('/urls/shorten', {
        method: 'POST',
        body: { originalUrl: url }
      });
      if (data.success) {
        const constructedShortUrl = `${BACKEND_URL}/r/${data.data.shortCode}`;
        setShortUrl(constructedShortUrl);
        const newLink = {
          id: data.data._id,
          originalUrl: data.data.originalUrl,
          shortUrl: constructedShortUrl,
          title: data.data.title,
          shortCode: data.data.shortCode
        };
        setRecentLinks([newLink, ...recentLinks]);
        setUrl('');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container" style={{ padding: '60px 24px' }}>
      {/* Hero Section */}
      <section className="text-center animate-fade-in" style={{ marginBottom: '60px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '14px', fontWeight: '600', marginBottom: '24px' }}>
          <Sparkles size={16} /> Simplify your connections
        </div>
        <h1 className="gradient-text" style={{ fontSize: '56px', lineHeight: '1.1', marginBottom: '20px', fontWeight: '800' }}>
          Shorten Links. Track Clicks. <br />Optimize Reach.
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '640px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Linklytics is an advanced URL shortener built for developers and businesses. Generate custom aliases, monitor in-depth traffic sources, and create dynamic QR codes.
        </p>

        {/* Shorten Box */}
        <div className="glass-panel" style={{ maxWidth: '720px', margin: '0 auto', padding: '24px' }}>
          <form onSubmit={handleShorten} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flexGrow: 1, position: 'relative' }}>
              <Link2 size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Paste your long link here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ paddingLeft: '48px', height: '52px' }}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 28px', height: '52px' }} disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#f87171', fontSize: '14px', textAlign: 'left' }}>
              {error}
            </div>
          )}

          {shortUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              <div className="animate-fade-in" style={{ padding: '16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: '12px', display: 'block', color: 'var(--accent-emerald)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Successfully Shortened</span>
                  <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600', textDecoration: 'none' }}>
                    {shortUrl}
                  </a>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => copyToClipboard(shortUrl)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {copied ? <Check size={16} style={{ color: '#10b981' }} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button type="button" onClick={() => setShowQr(!showQr)} className="btn btn-secondary btn-sm" style={{ padding: '8px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Show QR Code">
                    <QrCode size={16} style={{ color: showQr ? 'var(--accent-indigo)' : 'var(--text-secondary)' }} />
                  </button>
                </div>
              </div>

              {/* QR Code Expansion */}
              {showQr && (
                <div className="glass-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', background: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'inline-block' }}>
                    <QRCodeSVG id="home-qr" value={shortUrl} size={160} level="H" includeMargin={true} />
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '16px' }}>
                    Scan this QR code to visit your shortened link
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button"
                      onClick={() => downloadSVG('home-qr', 'shortened-url-qr')}
                      className="btn btn-secondary btn-sm"
                    >
                      Download SVG
                    </button>
                    <button 
                      type="button"
                      onClick={() => downloadPNG('home-qr', 'shortened-url-qr')}
                      className="btn btn-primary btn-sm"
                    >
                      Download PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Recent Links (for anon session) */}
      {recentLinks.length > 0 && (
        <section className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto 60px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'left' }}>Recent links created in this session</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentLinks.map((link) => (
              <div key={link.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', textALign: 'left' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', flexGrow: 1 }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.title}</h4>
                  <a href={link.shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-indigo)', fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}>
                    {link.shortUrl}
                  </a>
                </div>
                <button onClick={() => copyToClipboard(link.shortUrl)} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
                  <Copy size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section style={{ marginTop: '80px' }}>
        <h2 className="text-center" style={{ fontSize: '32px', marginBottom: '48px' }}>
          Packed with powerful features
        </h2>
        <div className="grid-3">
          <div className="glass-panel text-center">
            <div style={{ width: '48px', height: '48px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-indigo)' }}>
              <BarChart2 size={24} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>In-depth Analytics</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Track clicks in real-time. Gather statistics on OS, browser type, device profiles, referrer websites, and timeline activity.
            </p>
          </div>
          <div className="glass-panel text-center">
            <div style={{ width: '48px', height: '48px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-cyan)' }}>
              <QrCode size={24} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Instant QR Codes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Generate download-ready SVG/PNG QR codes for your links instantly. Ideal for print advertising and mobile scanning.
            </p>
          </div>
          <div className="glass-panel text-center">
            <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-emerald)' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Advanced Controls</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Designate expiration thresholds, custom brand aliases, title definitions, and secure access parameters.
            </p>
          </div>
        </div>
      </section>

      {/* Auth Prompt Callout */}
      <section className="glass-panel animate-fade-in" style={{ marginTop: '80px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 32px' }}>
        <Zap size={40} style={{ color: 'var(--accent-indigo)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Unlock full control of your links</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '540px', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6' }}>
          Create a free account to edit link destinations, delete links, generate custom back-halves, run bulk shorten jobs, and view persistent historic analytics charts.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/signup" className="btn btn-primary">Create Free Account</Link>
          <Link to="/login" className="btn btn-secondary">Sign In</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
