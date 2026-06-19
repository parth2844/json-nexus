import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { RefreshCw, Trash2 } from 'lucide-react';

const DEFAULT_ORIGINAL = `{
  "name": "JSON Nexus",
  "version": "1.0",
  "description": "Standard JSON Formatter",
  "active": true,
  "features": [
    "Prettify",
    "Minify",
    "Convert"
  ]
}`;

const DEFAULT_MODIFIED = `{
  "name": "JSON Nexus Pro",
  "version": "1.1",
  "description": "Premium JSON Workbench suite",
  "active": true,
  "features": [
    "Prettify",
    "Minify",
    "Convert",
    "Graph Visualization",
    "Diff Editor"
  ]
}`;

interface DiffViewProps {
  theme: 'dark' | 'light';
}

export const DiffView: React.FC<DiffViewProps> = ({ theme }) => {
  const [originalText, setOriginalText] = useState<string>(DEFAULT_ORIGINAL);
  const [modifiedText, setModifiedText] = useState<string>(DEFAULT_MODIFIED);

  const handleClear = () => {
    setOriginalText('{}');
    setModifiedText('{}');
  };

  const handleReset = () => {
    setOriginalText(DEFAULT_ORIGINAL);
    setModifiedText(DEFAULT_MODIFIED);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">JSON Diff</h2>
          <p className="workspace-desc">Compare two JSON objects side-by-side. Both editors are interactive and editable.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-sm" onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} />
            <span>Reset Demo</span>
          </button>
          <button className="btn btn-sm" onClick={handleClear} style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Trash2 size={12} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '0 20px 8px 20px', fontSize: '11px', color: '#64748b' }}>
        <div>Original JSON (Left)</div>
        <div style={{ paddingLeft: '16px' }}>Modified JSON (Right)</div>
      </div>

      <div className="glass-panel" style={{ flex: 1 }}>
        <div style={{ height: '100%', width: '100%' }}>
          <DiffEditor
            height="100%"
            language="json"
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            original={originalText}
            modified={modifiedText}
            onMount={(editor) => {
              // Capture changes to both editors to keep react states synchronized
              const orig = editor.getOriginalEditor();
              const mod = editor.getModifiedEditor();
              
              orig.onDidChangeModelContent(() => {
                setOriginalText(orig.getValue());
              });
              
              mod.onDidChangeModelContent(() => {
                setModifiedText(mod.getValue());
              });
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              originalEditable: true, // Let users edit the left pane!
              readOnly: false,          // Let users edit the right pane!
              fontFamily: "'Consolas', 'Courier New', monospace"
            }}
          />
        </div>
      </div>
    </div>
  );
};
