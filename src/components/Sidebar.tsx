import React from 'react';
import { 
  Braces, 
  Shield, 
  RefreshCw, 
  Columns, 
  Sparkles, 
  CaseSensitive,
  Sun,
  Moon
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  theme, 
  toggleTheme 
}) => {
  const menuItems = [
    {
      id: 'formatter',
      label: 'Formatter & Editor',
      description: 'Format, query, & visualize',
      icon: <Braces size={20} />
    },
    {
      id: 'schema',
      label: 'Schema Validator',
      description: 'Validate against schemas',
      icon: <Shield size={20} />
    },
    {
      id: 'converter',
      label: 'Conversion & CodeGen',
      description: 'Convert JSON to YAML/XML/code',
      icon: <RefreshCw size={20} />
    },
    {
      id: 'diff',
      label: 'JSON Diff',
      description: 'Compare side-by-side',
      icon: <Columns size={20} />
    },
    {
      id: 'generator',
      label: 'Mock Generator',
      description: 'Generate mock datasets',
      icon: <Sparkles size={20} />
    },
    {
      id: 'escaper',
      label: 'String Escaper',
      description: 'Escape/unescape strings',
      icon: <CaseSensitive size={20} />
    }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">{'{ }'}</div>
        <div>
          <div className="logo-text">JSON Nexus</div>
        </div>
      </div>
      
      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
            title={item.description}
          >
            <span style={{ color: activeView === item.id ? 'var(--primary-accent)' : 'inherit', display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'inherit' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.description}</div>
            </div>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ color: 'var(--text-muted)' }}>
        <button 
          onClick={toggleTheme}
          className="btn btn-sm"
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            marginBottom: '10px',
            background: 'var(--bg-hover)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
            gap: '8px'
          }}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={14} style={{ color: '#f59e0b' }} /> : <Moon size={14} style={{ color: '#6366f1' }} />}
          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>100% Client-Side</div>
        <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.8 }}>
          Data never leaves your browser
        </div>
      </div>
    </aside>
  );
};
