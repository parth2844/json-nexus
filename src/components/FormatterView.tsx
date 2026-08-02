import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Copy, 
  Trash2, 
  Search, 
  Check, 
  AlertTriangle
} from 'lucide-react';
import './FormatterView.css';
import { evaluateJsonPath, evaluateJavaScriptFilter } from '../utils/jsonpath';

// Sample JSON payloads
const SAMPLES = {
  user: {
    id: 1047,
    name: "Alex Rivera",
    username: "arivera_dev",
    email: "alex.rivera@codenexus.io",
    active: true,
    roles: ["Admin", "Developer"],
    profile: {
      bio: "Crafting beautiful client-side web tools",
      github: "https://github.com/arivera",
      location: "San Francisco, CA"
    },
    organization: {
      name: "Nexus Labs",
      established: 2024,
      ratings: {
        stars: 4.8,
        reviews: 240
      }
    }
  },
  products: [
    {
      id: "prod_01",
      title: "Vapor-M1 Keyboard",
      price: 189.99,
      inStock: true,
      specs: { switches: "Linear Red", layout: "ANSI 75%" },
      tags: ["gaming", "mechanical", "premium"]
    },
    {
      id: "prod_02",
      title: "Pulse Wireless Mouse",
      price: 89.50,
      inStock: false,
      specs: { dpi: 20000, sensor: "Optical" },
      tags: ["gaming", "wireless"]
    },
    {
      id: "prod_03",
      title: "Omni Curved Monitor",
      price: 349.99,
      inStock: true,
      specs: { size: "34 inch", refresh: "144Hz" },
      tags: ["productivity", "curved"]
    }
  ],
  deep: {
    project: "JSON Nexus",
    status: "Active",
    timeline: {
      start: "2026-01-01",
      milestones: [
        { phase: "Design", completed: true, cost: 5000 },
        { phase: "Core Engine", completed: true, cost: 12000 },
        { phase: "Visualization Views", completed: false, developers: ["Parth", "Gemini"] }
      ]
    },
    metadata: {
      tags: ["json", "prettier", "editor", "graph"],
      environments: {
        development: { port: 5173, hotReload: true },
        production: { path: "/dist", compression: "brotli" }
      }
    }
  },
  invalid: `{
  "id": 102,
  "name": "Broken JSON",
  "missing_comma": "This is broken"
  "details": {
    "nested": true
  }
}`
};

interface FormatterViewProps {
  initialCode?: string;
  theme: 'dark' | 'light';
}

export const FormatterView: React.FC<FormatterViewProps> = ({ initialCode = '', theme }) => {
  const [jsonText, setJsonText] = useState<string>(
    initialCode || JSON.stringify(SAMPLES.user, null, 2)
  );
  const [parsedJson, setParsedJson] = useState<any>(SAMPLES.user);
  const [filteredJson, setFilteredJson] = useState<any>(SAMPLES.user);
  const [error, setError] = useState<string | null>(null);
  
  // Format options
  const [indentSize, setIndentSize] = useState<number>(2);
  const [isMinified, setIsMinified] = useState<boolean>(false);
  
  // View tabs: 'code' | 'tree' | 'table' | 'graph'
  const [activeTab, setActiveTab] = useState<string>('code');
  
  // Querying states
  const [queryMode, setQueryMode] = useState<'jsonpath' | 'js'>('jsonpath');
  const [queryStr, setQueryStr] = useState<string>('');
  
  // Stats
  const [stats, setStats] = useState({
    size: '0 B',
    depth: 0,
    keys: 0,
    arrays: 0
  });

  const [copied, setCopied] = useState(false);

  // Validate and parse whenever jsonText changes
  useEffect(() => {
    try {
      if (!jsonText.trim()) {
        setParsedJson(null);
        setFilteredJson(null);
        setError(null);
        return;
      }
      
      const parsed = JSON.parse(jsonText);
      setParsedJson(parsed);
      setError(null);
      
      // Calculate Stats
      const sizeBytes = new Blob([jsonText]).size;
      const sizeStr = sizeBytes > 1024 * 1024 
        ? `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
        : sizeBytes > 1024 
          ? `${(sizeBytes / 1024).toFixed(2)} KB` 
          : `${sizeBytes} B`;
      
      let maxDepth = 0;
      let totalKeys = 0;
      let totalArrays = 0;
      
      function analyze(val: any, currentDepth: number) {
        maxDepth = Math.max(maxDepth, currentDepth);
        if (val === null || typeof val !== 'object') return;
        
        if (Array.isArray(val)) {
          totalArrays++;
          val.forEach(item => analyze(item, currentDepth + 1));
        } else {
          const keys = Object.keys(val);
          totalKeys += keys.length;
          keys.forEach(k => analyze(val[k], currentDepth + 1));
        }
      }
      
      analyze(parsed, 1);
      
      setStats({
        size: sizeStr,
        depth: maxDepth,
        keys: totalKeys,
        arrays: totalArrays
      });
      
    } catch (err: any) {
      setError(err.message);
    }
  }, [jsonText]);

  // Apply JSONPath or JS query filters
  useEffect(() => {
    if (error || !parsedJson) {
      setFilteredJson(parsedJson);
      return;
    }

    if (!queryStr.trim()) {
      setFilteredJson(parsedJson);
      return;
    }

    try {
      if (queryMode === 'jsonpath') {
        const result = evaluateJsonPath(parsedJson, queryStr);
        setFilteredJson(result === undefined ? null : result);
      } else {
        const result = evaluateJavaScriptFilter(parsedJson, queryStr);
        setFilteredJson(result === undefined ? null : result);
      }
      setError(null);
    } catch (err: any) {
      setError(`Query Error: ${err.message}`);
    }
  }, [parsedJson, queryStr, queryMode, error]);

  // Formatting operations
  const handlePrettify = (spaces: number) => {
    try {
      if (!jsonText.trim()) return;
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, spaces));
      setIsMinified(false);
      setIndentSize(spaces);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMinify = () => {
    try {
      if (!jsonText.trim()) return;
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed));
      setIsMinified(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClear = () => {
    setJsonText('');
    setQueryStr('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(
      activeTab === 'code' 
        ? (typeof filteredJson === 'object' ? JSON.stringify(filteredJson, null, 2) : String(filteredJson))
        : jsonText
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSample = (key: keyof typeof SAMPLES) => {
    const data = SAMPLES[key];
    if (typeof data === 'string') {
      setJsonText(data);
    } else {
      setJsonText(JSON.stringify(data, null, 2));
    }
    setQueryStr('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">Formatter & Editor</h2>
          <p className="workspace-desc">Beautify, lint, run JSONPath queries, and explore structures interactively.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Samples:</span>
          <button className="btn btn-sm" onClick={() => loadSample('user')}>Profile</button>
          <button className="btn btn-sm" onClick={() => loadSample('products')}>Array</button>
          <button className="btn btn-sm" onClick={() => loadSample('deep')}>Complex</button>
          <button className="btn btn-sm" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => loadSample('invalid')}>Broken</button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <div style={{ flex: 1 }}>{error}</div>
        </div>
      )}

      {/* Top Query Panel */}
      <div className="query-panel">
        <div className="view-tabs" style={{ marginRight: '8px' }}>
          <button 
            className={`tab-btn ${queryMode === 'jsonpath' ? 'active' : ''}`}
            onClick={() => setQueryMode('jsonpath')}
          >
            JSONPath
          </button>
          <button 
            className={`tab-btn ${queryMode === 'js' ? 'active' : ''}`}
            onClick={() => setQueryMode('js')}
          >
            JS Transform
          </button>
        </div>
        <div className="query-input-wrapper">
          <Search size={16} className="query-icon" />
          <input 
            type="text" 
            className="query-field" 
            placeholder={
              queryMode === 'jsonpath' 
                ? "Filter path (e.g. $.profile.location or $.products[*].price)" 
                : "JS Function (e.g. (data) => data.filter(x => x.price > 100))"
            }
            value={queryStr}
            onChange={(e) => setQueryStr(e.target.value)}
          />
          {queryStr && (
            <button 
              className="btn btn-sm" 
              style={{ border: 'none', background: 'transparent', padding: '2px' }}
              onClick={() => setQueryStr('')}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1 }}>
        <div className="dual-pane">
          {/* Left Editor */}
          <div className="pane-left">
            <div className="pane-header">
              <span className="pane-title">Input Editor</span>
              <div className="btn-group">
                <button 
                  className={`btn btn-sm ${!isMinified && indentSize === 2 ? 'btn-primary' : ''}`} 
                  onClick={() => handlePrettify(2)}
                >
                  Tab: 2
                </button>
                <button 
                  className={`btn btn-sm ${!isMinified && indentSize === 4 ? 'btn-primary' : ''}`} 
                  onClick={() => handlePrettify(4)}
                >
                  Tab: 4
                </button>
                <button 
                  className={`btn btn-sm ${isMinified ? 'btn-primary' : ''}`} 
                  onClick={handleMinify}
                >
                  Minify
                </button>
                <button 
                  className="btn btn-sm" 
                  style={{ color: '#ef4444' }} 
                  onClick={handleClear}
                  title="Clear Editor"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="pane-body">
              <Editor
                height="100%"
                language="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={jsonText}
                onChange={(val) => setJsonText(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: indentSize,
                  fontFamily: "'Consolas', 'Courier New', monospace"
                }}
              />
            </div>
          </div>

          {/* Right Visualizer Output */}
          <div className="pane-right">
            <div className="pane-header">
              <div className="view-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveTab('code')}
                >
                  Code
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'tree' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tree')}
                >
                  Tree
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  Table
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
                  onClick={() => setActiveTab('graph')}
                >
                  Visual Graph
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm" onClick={handleCopy}>
                  {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Output'}</span>
                </button>
              </div>
            </div>
            
            <div className="pane-body">
              {activeTab === 'code' && (
                <Editor
                  height="100%"
                  language="json"
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  value={
                    filteredJson !== undefined 
                      ? JSON.stringify(filteredJson, null, 2) 
                      : '{}'
                  }
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    domReadOnly: true,
                    fontFamily: "'Consolas', 'Courier New', monospace"
                  }}
                />
              )}

              {activeTab === 'tree' && (
                <div style={{ padding: '20px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
                  {filteredJson !== null ? (
                    <RecursiveTreeRoot data={filteredJson} />
                  ) : (
                    <div className="empty-state">No JSON loaded or query returned empty.</div>
                  )}
                </div>
              )}

              {activeTab === 'table' && (
                <div style={{ height: '100%', overflow: 'auto' }}>
                  <TableVisualizer data={filteredJson} />
                </div>
              )}

              {activeTab === 'graph' && (
                <div style={{ height: '100%', overflow: 'hidden' }}>
                  <GraphVisualizer data={filteredJson} theme={theme} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Stat Bar */}
        <div className="stat-bar">
          <div className="stat-item">
            Size: <span className="stat-val">{stats.size}</span>
          </div>
          <div className="stat-item">
            Max Nesting Depth: <span className="stat-val">{stats.depth}</span>
          </div>
          <div className="stat-item">
            Total Keys: <span className="stat-val">{stats.keys}</span>
          </div>
          <div className="stat-item">
            Arrays Count: <span className="stat-val">{stats.arrays}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// TREE VIEWER SUBCOMPONENTS
// ------------------------------------------------------------------
interface TreeElementProps {
  name: string | number;
  value: any;
  depth: number;
  path: string;
}

const RecursiveTreeNode: React.FC<TreeElementProps> = ({ name, value, depth, path }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(depth < 2); // Auto-expand shallow items
  const [copied, setCopied] = useState(false);

  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderValueText = () => {
    if (value === null) return <span className="val-null">null</span>;
    if (typeof value === 'string') return <span className="val-string">"{value}"</span>;
    if (typeof value === 'number') return <span className="val-number">{value}</span>;
    if (typeof value === 'boolean') return <span className="val-bool">{value ? 'true' : 'false'}</span>;
    return null;
  };

  if (!isObject) {
    return (
      <div className="tree-node" style={{ marginLeft: `${depth * 8}px` }}>
        <div className="tree-header" style={{ cursor: 'default' }}>
          <span className="key-name">{name}:</span>
          <span>{renderValueText()}</span>
          <button 
            onClick={handleCopyPath} 
            className={`tree-copy-btn ${copied ? 'copied' : ''}`}
            title="Copy path"
          >
            {copied ? 'Copied' : 'copy path'}
          </button>
        </div>
      </div>
    );
  }

  const keys = Object.keys(value);
  const sizeText = isArray ? `[${value.length} items]` : `{${keys.length} keys}`;
  const bracketOpen = isArray ? '[' : '{';
  const bracketClose = isArray ? ']' : '}';

  return (
    <div className="tree-node" style={{ marginLeft: `${depth * 8}px` }}>
      <div className="tree-node-line" />
      <div className="tree-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className={`tree-arrow ${isExpanded ? 'expanded' : ''}`}>▶</span>
        <span className="key-name">{name}:</span>
        <span className="val-bracket">{bracketOpen}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{sizeText}</span>
        <button 
          onClick={handleCopyPath} 
          className={`tree-copy-btn ${copied ? 'copied' : ''}`}
          title="Copy path"
        >
          {copied ? 'Copied' : 'copy path'}
        </button>
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: '2px' }}>
          {keys.map((k) => {
            const childPath = isArray 
              ? `${path}[${k}]` 
              : `${path}.${k}`;
            return (
              <RecursiveTreeNode
                key={k}
                name={isArray ? Number(k) : k}
                value={value[k]}
                depth={depth + 1}
                path={childPath}
              />
            );
          })}
          <div className="val-bracket" style={{ paddingLeft: '20px', marginTop: '2px' }}>{bracketClose}</div>
        </div>
      )}
    </div>
  );
};

const RecursiveTreeRoot: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div style={{ textAlign: 'left' }}>
      <RecursiveTreeNode name="Root" value={data} depth={0} path="$" />
    </div>
  );
};

// ------------------------------------------------------------------
// TABLE VIEW SUBCOMPONENT
// ------------------------------------------------------------------
import { flattenObject } from '../utils/converters';

const TableVisualizer: React.FC<{ data: any }> = ({ data }) => {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  let arrayData: any[] = [];
  if (Array.isArray(data)) {
    arrayData = data;
  } else if (typeof data === 'object' && data !== null) {
    arrayData = [data];
  } else {
    return (
      <div className="empty-state">
        <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
        <span>Table view is only available for JSON arrays or objects.</span>
      </div>
    );
  }

  if (arrayData.length === 0) {
    return <div className="empty-state">Array is empty.</div>;
  }

  // Flatten row objects
  const flatRows = arrayData.map(row => flattenObject(row));

  // Gather unique headers
  const headersSet = new Set<string>();
  flatRows.forEach(row => {
    Object.keys(row).forEach(k => headersSet.add(k));
  });
  const headers = Array.from(headersSet);

  // Sorting logic
  const handleSort = (header: string) => {
    if (sortKey === header) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(header);
      setSortAsc(true);
    }
  };

  const sortedRows = [...flatRows].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === undefined || aVal === null) return sortAsc ? 1 : -1;
    if (bVal === undefined || bVal === null) return sortAsc ? -1 : 1;

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    return sortAsc 
      ? aStr.localeCompare(bStr) 
      : bStr.localeCompare(aStr);
  });

  return (
    <div className="table-container">
      <table className="grid-table">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} onClick={() => handleSort(header)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{header}</span>
                  {sortKey === header && (
                    <span style={{ fontSize: '10px' }}>{sortAsc ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, idx) => (
            <tr key={idx}>
              {headers.map(header => {
                const val = row[header];
                let displayVal = '';
                if (val !== undefined && val !== null) {
                  displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                }
                return (
                  <td key={header} title={displayVal}>
                    {displayVal === '' ? <span className="table-null-dash">—</span> : displayVal}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ------------------------------------------------------------------
// GRAPH VIEW SUBCOMPONENT (SVG NODES AND BEZIER PATHS)
// ------------------------------------------------------------------
interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
  type: string;
  valueText: string;
}

interface GraphLink {
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const GraphVisualizer: React.FC<{ data: any; theme: 'dark' | 'light' }> = ({ data, theme }) => {
  if (data === null || data === undefined) {
    return <div className="empty-state">No valid JSON data.</div>;
  }

  // Build simple horizontal graph layout
  const buildGraphLayout = (obj: any) => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    let idCounter = 0;
    
    const maxNodes = 80; // Limit node spamming for browser performance
    const levelYCounters: { [level: number]: number } = {};
    const levelXDistance = 260;
    const nodeHeight = 54;
    const nodeWidth = 190;
    const verticalGap = 16;
    
    function traverse(val: any, label: string, depth: number, parentId: string | null): string | null {
      if (nodes.length >= maxNodes) return null;
      
      const id = `node_${idCounter++}`;
      let type = 'primitive';
      let valueText = '';
      
      if (val === null) {
        valueText = 'null';
        type = 'null';
      } else if (Array.isArray(val)) {
        type = 'array';
        valueText = `[Array: ${val.length} items]`;
      } else if (typeof val === 'object') {
        type = parentId === null ? 'root' : 'object';
        valueText = `{Object: ${Object.keys(val).length} keys}`;
      } else {
        valueText = String(val);
        type = typeof val;
      }
      
      if (levelYCounters[depth] === undefined) {
        levelYCounters[depth] = 30;
      }
      const y = levelYCounters[depth];
      levelYCounters[depth] += nodeHeight + verticalGap;
      
      const x = 40 + depth * levelXDistance;
      
      nodes.push({
        id,
        label,
        x,
        y,
        depth,
        type,
        valueText
      });
      
      if (parentId !== null) {
        const parent = nodes.find(n => n.id === parentId);
        if (parent) {
          links.push({
            sourceId: parentId,
            targetId: id,
            x1: parent.x + nodeWidth,
            y1: parent.y + nodeHeight / 2,
            x2: x,
            y2: y + nodeHeight / 2
          });
        }
      }
      
      if (depth < 3) {
        if (Array.isArray(val)) {
          val.slice(0, 3).forEach((item, index) => {
            traverse(item, `[${index}]`, depth + 1, id);
          });
          if (val.length > 3) {
            const truncId = `trunc_${idCounter++}`;
            const tY = levelYCounters[depth + 1] || 30;
            levelYCounters[depth + 1] = tY + nodeHeight + verticalGap;
            const tX = 40 + (depth + 1) * levelXDistance;
            
            nodes.push({
              id: truncId,
              label: `+ ${val.length - 3} items`,
              x: tX,
              y: tY,
              depth: depth + 1,
              type: 'truncate',
              valueText: ''
            });
            links.push({
              sourceId: id,
              targetId: truncId,
              x1: x + nodeWidth,
              y1: y + nodeHeight / 2,
              x2: tX,
              y2: tY + nodeHeight / 2
            });
          }
        } else if (typeof val === 'object' && val !== null) {
          const keys = Object.keys(val);
          keys.slice(0, 5).forEach(key => {
            traverse(val[key], key, depth + 1, id);
          });
          if (keys.length > 5) {
            const truncId = `trunc_${idCounter++}`;
            const tY = levelYCounters[depth + 1] || 30;
            levelYCounters[depth + 1] = tY + nodeHeight + verticalGap;
            const tX = 40 + (depth + 1) * levelXDistance;
            
            nodes.push({
              id: truncId,
              label: `+ ${keys.length - 5} keys`,
              x: tX,
              y: tY,
              depth: depth + 1,
              type: 'truncate',
              valueText: ''
            });
            links.push({
              sourceId: id,
              targetId: truncId,
              x1: x + nodeWidth,
              y1: y + nodeHeight / 2,
              x2: tX,
              y2: tY + nodeHeight / 2
            });
          }
        }
      }
      
      return id;
    }

    traverse(obj, 'JSON Root', 0, null);

    const maxHeight = Math.max(...Object.values(levelYCounters), 500) + 100;
    const maxDepthVal = Math.max(...nodes.map(n => n.depth), 0);
    const maxWidth = 40 + (maxDepthVal + 1) * levelXDistance + 100;

    return { nodes, links, width: maxWidth, height: maxHeight };
  };

  const { nodes, links, width, height } = buildGraphLayout(data);

  return (
    <div className="graph-container">
      <div className="graph-svg-wrapper" style={{ width: `${width}px`, height: `${height}px` }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
              <stop offset="100%" stopColor="rgba(168, 85, 247, 0.2)" />
            </linearGradient>
            <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.4" />
            </filter>
          </defs>
          
          {/* Render Connections */}
          {links.map((link, idx) => {
            const midX = (link.x1 + link.x2) / 2;
            const pathData = `M ${link.x1} ${link.y1} C ${midX} ${link.y1}, ${midX} ${link.y2}, ${link.x2} ${link.y2}`;
            
            return (
              <path 
                key={idx} 
                d={pathData} 
                className="graph-link-line"
                style={{ stroke: theme === 'dark' ? 'url(#link-grad)' : 'rgba(99, 102, 241, 0.45)' }}
              />
            );
          })}

          {/* Render Nodes */}
          {nodes.map(node => {
            const isTruncate = node.type === 'truncate';
            const isRoot = node.type === 'root';
            const isObj = node.type === 'object';
            const isArr = node.type === 'array';
            const isDark = theme === 'dark';
            
            let strokeColor = 'rgba(99, 102, 241, 0.3)';
            if (isRoot) strokeColor = '#a855f7';
            else if (isTruncate) strokeColor = isDark ? '#475569' : '#cbd5e1';
            else if (isObj) strokeColor = '#6366f1';
            else if (isArr) strokeColor = '#10b981';

            let valueColor = isDark ? '#cbd5e1' : '#334155';
            if (node.type === 'string') valueColor = isDark ? '#a7f3d0' : '#166534';
            else if (node.type === 'number') valueColor = isDark ? '#fbcfe8' : '#9d174d';
            else if (node.type === 'boolean') valueColor = isDark ? '#fde047' : '#b45309';
            else if (node.type === 'null') valueColor = isDark ? '#94a3b8' : '#64748b';

            return (
              <g key={node.id} style={{ transform: `translate(${node.x}px, ${node.y}px)` }}>
                <rect 
                  width="180" 
                  height="50" 
                  className={`graph-node-rect ${isRoot ? 'root' : ''}`}
                  style={{ 
                    stroke: strokeColor,
                    fill: isDark 
                      ? (isRoot 
                        ? 'rgba(168, 85, 247, 0.12)' 
                        : isTruncate 
                          ? 'rgba(30, 41, 59, 0.3)' 
                          : 'rgba(22, 28, 45, 0.8)')
                      : (isRoot
                        ? 'rgba(168, 85, 247, 0.06)'
                        : isTruncate
                          ? '#f1f5f9'
                          : '#ffffff'),
                    cursor: 'default'
                  }}
                />
                
                <text 
                  x="12" 
                  y="20" 
                  className="graph-node-text graph-node-key"
                  style={{ 
                    fontSize: '11px', 
                    fill: isDark 
                      ? (isRoot ? '#d8b4fe' : '#93c5fd')
                      : (isRoot ? '#7c3aed' : '#4f46e5'),
                    fontWeight: 600
                  }}
                >
                  {node.label.length > 22 ? `${node.label.slice(0, 20)}...` : node.label}
                </text>

                {!isTruncate && (
                  <text 
                    x="12" 
                    y="38" 
                    className="graph-node-text"
                    style={{ 
                      fontSize: '11px', 
                      fill: valueColor,
                      fontFamily: node.type !== 'object' && node.type !== 'array' ? 'monospace' : 'inherit'
                    }}
                  >
                    {node.valueText.length > 24 ? `${node.valueText.slice(0, 22)}...` : node.valueText}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
