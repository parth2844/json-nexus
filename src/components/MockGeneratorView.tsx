import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  ArrowRight,
  Database,
  ShoppingBag,
  ListTodo,
  CloudSun
} from 'lucide-react';
import './MockGeneratorView.css';

interface MockGeneratorViewProps {
  onSendToFormatter: (jsonStr: string) => void;
  theme: 'dark' | 'light';
}

type TemplateType = 'users' | 'products' | 'tasks' | 'weather';

export const MockGeneratorView: React.FC<MockGeneratorViewProps> = ({ onSendToFormatter, theme }) => {
  const [template, setTemplate] = useState<TemplateType>('users');
  const [count, setCount] = useState<number>(10);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Lists for mock generator
  const FIRST_NAMES = ['Ethan', 'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Oliver', 'Sophia', 'Lucas', 'Isabella', 'Mason', 'Mia'];
  const LAST_NAMES = ['Chen', 'Miller', 'Rodriguez', 'Smith', 'Taylor', 'Davis', 'Gomez', 'Wilson', 'Anderson', 'Martin', 'Patel', 'Kim'];
  const DOMAINS = ['codenexus.io', 'nexuslabs.dev', 'gmail.com', 'outlook.com', 'yahoo.com'];
  const ROLES = ['Admin', 'Developer', 'Designer', 'Manager', 'Tester'];
  
  const PRODUCT_TITLES = ['Horizon Monitor', 'Vulcan Mouse', 'Zenith Keyboard', 'Orbit Keycap Set', 'Helix Audio Interface', 'Nova Speakers', 'Titan GPU Cooler', 'Prism RGB Strip'];
  const CATEGORIES = ['Displays', 'Peripherals', 'Audio', 'Accessories', 'Hardware'];
  
  const TASK_TITLES = ['Implement JWT Authentication', 'Design settings dashboard', 'Optimize database indexes', 'Fix memory leaks in tree nodes', 'Write integration tests', 'Refactor auth state hook', 'Configure Webpack aliases', 'Update API endpoints documentation'];
  
  const CITIES = ['San Francisco', 'Tokyo', 'London', 'Berlin', 'Sydney', 'Paris', 'New York', 'Toronto'];
  const CONDITIONS = ['Sunny', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Thunderstorm', 'Heavy Snow', 'Foggy'];

  const generateData = () => {
    const arr: any[] = [];
    
    for (let i = 0; i < count; i++) {
      if (template === 'users') {
        const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
        
        // Random roles selection
        const userRoles: string[] = [];
        const roleCount = Math.floor(Math.random() * 2) + 1;
        while(userRoles.length < roleCount) {
          const r = ROLES[Math.floor(Math.random() * ROLES.length)];
          if (!userRoles.includes(r)) userRoles.push(r);
        }

        arr.push({
          id: 1000 + i,
          name: `${first} ${last}`,
          username: `${first.toLowerCase()}_${last.toLowerCase()}`,
          email: `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`,
          age: Math.floor(Math.random() * 45) + 18,
          active: Math.random() > 0.3,
          roles: userRoles,
          profile: {
            avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${first}${last}`,
            joinDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0]
          }
        });
      } else if (template === 'products') {
        const title = PRODUCT_TITLES[Math.floor(Math.random() * PRODUCT_TITLES.length)];
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const price = Number((Math.random() * 250 + 15).toFixed(2));
        
        arr.push({
          productId: `prod_${100 + i}`,
          title: `${title} v${i + 1}`,
          category,
          price,
          inStock: Math.random() > 0.25,
          rating: Number((Math.random() * 1.5 + 3.5).toFixed(1)),
          dimensions: {
            width: Math.floor(Math.random() * 30) + 10,
            height: Math.floor(Math.random() * 20) + 5,
            weightKg: Number((Math.random() * 5 + 0.2).toFixed(2))
          }
        });
      } else if (template === 'tasks') {
        const title = TASK_TITLES[Math.floor(Math.random() * TASK_TITLES.length)];
        const assigneeFirst = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const assigneeLast = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        
        arr.push({
          taskId: `task_${500 + i}`,
          title: `${title} (${i + 1})`,
          completed: Math.random() > 0.5,
          priority: Math.random() > 0.7 ? 'High' : Math.random() > 0.5 ? 'Medium' : 'Low',
          dueDate: new Date(Date.now() + Math.random() * 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
          assignee: {
            name: `${assigneeFirst} ${assigneeLast}`,
            email: `${assigneeFirst.toLowerCase()}@codenexus.io`
          }
        });
      } else if (template === 'weather') {
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
        
        arr.push({
          logId: `log_${2000 + i}`,
          location: {
            city,
            country: city === 'Tokyo' ? 'Japan' : city === 'London' ? 'UK' : city === 'Sydney' ? 'Australia' : city === 'Paris' ? 'France' : city === 'Berlin' ? 'Germany' : 'USA'
          },
          temperatureC: Number((Math.random() * 35 - 5).toFixed(1)),
          humidityPercent: Math.floor(Math.random() * 60) + 30,
          condition,
          windSpeedKmh: Number((Math.random() * 40).toFixed(1)),
          timestamp: new Date(Date.now() - i * 1000 * 60 * 60).toISOString()
        });
      }
    }
    
    setGeneratedText(JSON.stringify(arr, null, 2));
  };

  // Generate automatically on configuration change
  useEffect(() => {
    generateData();
  }, [template, count]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">Mock Generator</h2>
          <p className="workspace-desc">Instantly populate dummy datasets for development testing and design prototypes.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1 }}>
        <div className="dual-pane">
          {/* Settings Side */}
          <div className="pane-left generator-pane-left">
            <div className="pane-header">
              <span className="pane-title">Generator Options</span>
            </div>
            
            <div className="generator-layout">
              <div className="generator-section">
                <label>Select Template</label>
                <div className="template-grid">
                  <button 
                    className={`template-card ${template === 'users' ? 'active' : ''}`}
                    onClick={() => setTemplate('users')}
                  >
                    <Database size={20} style={{ margin: '0 auto 8px auto', display: 'block', color: '#6366f1' }} />
                    <span className="template-title">Users List</span>
                  </button>
                  <button 
                    className={`template-card ${template === 'products' ? 'active' : ''}`}
                    onClick={() => setTemplate('products')}
                  >
                    <ShoppingBag size={20} style={{ margin: '0 auto 8px auto', display: 'block', color: '#10b981' }} />
                    <span className="template-title">Products</span>
                  </button>
                  <button 
                    className={`template-card ${template === 'tasks' ? 'active' : ''}`}
                    onClick={() => setTemplate('tasks')}
                  >
                    <ListTodo size={20} style={{ margin: '0 auto 8px auto', display: 'block', color: '#a855f7' }} />
                    <span className="template-title">Tasks</span>
                  </button>
                  <button 
                    className={`template-card ${template === 'weather' ? 'active' : ''}`}
                    onClick={() => setTemplate('weather')}
                  >
                    <CloudSun size={20} style={{ margin: '0 auto 8px auto', display: 'block', color: '#f59e0b' }} />
                    <span className="template-title">Weather Logs</span>
                  </button>
                </div>
              </div>

              <div className="generator-section">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Record Count</label>
                  <span className="slider-val">{count} items</span>
                </div>
                <div className="slider-container">
                  <input 
                    type="range" 
                    min="1" 
                    max="150" 
                    value={count} 
                    onChange={(e) => setCount(Number(e.target.value))} 
                  />
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={generateData}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={16} />
                  <span>Regenerate Dataset</span>
                </button>
                
                <button 
                  className="btn" 
                  onClick={() => onSendToFormatter(generatedText)}
                  style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(99, 102, 241, 0.4)', background: 'rgba(99, 102, 241, 0.05)' }}
                >
                  <span>Load in Formatter</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Results Editor Side */}
          <div className="pane-right">
            <div className="pane-header">
              <span className="pane-title">Generated JSON Output</span>
              <button className="btn btn-sm" onClick={handleCopy}>
                {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="pane-body">
              <Editor
                height="100%"
                language="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={generatedText}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: "'Consolas', 'Courier New', monospace"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
