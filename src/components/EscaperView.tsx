import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Copy, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import './EscaperView.css';

interface EscaperViewProps {
  theme: 'dark' | 'light';
}

export const EscaperView: React.FC<EscaperViewProps> = ({ theme }) => {
  const [rawText, setRawText] = useState<string>(
    JSON.stringify({ message: "Hello Developer!", nested: "This has \"quotes\" and\nnewlines." }, null, 2)
  );
  const [escapedText, setEscapedText] = useState<string>(
    `{\\n  \\"message\\": \\"Hello Developer!\\",\\n  \\"nested\\": \\"This has \\\\\\\"quotes\\\\\\\" and\\\\nnewlines.\\"\\n}`
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);
  const [copiedEscaped, setCopiedEscaped] = useState<boolean>(false);

  const handleEscape = () => {
    try {
      if (!rawText.trim()) return;
      // To escape, we can use JSON.stringify twice, or escape manually
      const escaped = JSON.stringify(rawText);
      // Strip starting and ending quotes of double stringify
      setEscapedText(escaped.slice(1, -1));
      setError(null);
    } catch (err: any) {
      setError(`Escape Error: ${err.message}`);
    }
  };

  const handleUnescape = () => {
    try {
      if (!escapedText.trim()) return;
      // To unescape, wrap in quotes and JSON.parse
      const unescaped = JSON.parse(`"${escapedText}"`);
      setRawText(unescaped);
      setError(null);
    } catch (err: any) {
      setError(`Unescape Error: ${err.message}`);
    }
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(rawText);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleCopyEscaped = () => {
    navigator.clipboard.writeText(escapedText);
    setCopiedEscaped(true);
    setTimeout(() => setCopiedEscaped(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">String Escaper</h2>
          <p className="workspace-desc">Quickly escape quotes, newlines, and tabs inside JSON structures, or parse stringified JSON back into normal text.</p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <div>{error}</div>
        </div>
      )}

      <div className="glass-panel" style={{ flex: 1 }}>
        <div className="dual-pane">
          {/* Raw Input Editor */}
          <div className="pane-left">
            <div className="pane-header">
              <span className="pane-title">Raw Text / JSON</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm" onClick={handleCopyRaw}>
                  {copiedRaw ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                  <span>Copy</span>
                </button>
                <button className="btn btn-sm btn-primary" onClick={handleEscape} style={{ padding: '4px 10px' }}>
                  <span>Escape</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
            <div className="pane-body">
              <Editor
                height="100%"
                language="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={rawText}
                onChange={(val) => setRawText(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: "'Consolas', 'Courier New', monospace"
                }}
              />
            </div>
          </div>

          {/* Escaped Output Editor */}
          <div className="pane-right">
            <div className="pane-header">
              <span className="pane-title">Escaped Text String</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-sm btn-primary" onClick={handleUnescape} style={{ padding: '4px 10px' }}>
                  <ArrowLeft size={12} />
                  <span>Unescape</span>
                </button>
                <button className="btn btn-sm" onClick={handleCopyEscaped}>
                  {copiedEscaped ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                  <span>Copy</span>
                </button>
              </div>
            </div>
            <div className="pane-body">
              <Editor
                height="100%"
                language="text"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={escapedText}
                onChange={(val) => setEscapedText(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
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
