import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Ajv from 'ajv';
import type { ErrorObject } from 'ajv';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info
} from 'lucide-react';

const DEFAULT_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProductCatalog",
  "type": "object",
  "properties": {
    "store": { "type": "string" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "pattern": "^prod_[0-9]+$" },
          "name": { "type": "string", "minLength": 3 },
          "price": { "type": "number", "minimum": 0 },
          "tags": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["id", "name", "price"]
      }
    }
  },
  "required": ["store", "items"]
}`;

const DEFAULT_JSON = `{
  "store": "Nexus Tech",
  "items": [
    {
      "id": "prod_091",
      "name": "Hyper Charger",
      "price": 29.99,
      "tags": ["accessory", "usb-c"]
    },
    {
      "id": "broken_id",
      "name": "WS",
      "price": -10,
      "tags": ["error"]
    }
  ]
}`;

interface SchemaValidatorViewProps {
  theme: 'dark' | 'light';
}

export const SchemaValidatorView: React.FC<SchemaValidatorViewProps> = ({ theme }) => {
  const [schemaText, setSchemaText] = useState<string>(DEFAULT_SCHEMA);
  const [jsonText, setJsonText] = useState<string>(DEFAULT_JSON);
  
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [jsonSyntaxError, setJsonSyntaxError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ErrorObject[]>([]);
  const [isValid, setIsValid] = useState<boolean>(false);

  useEffect(() => {
    // Reset errors
    setSchemaError(null);
    setJsonSyntaxError(null);
    setValidationErrors([]);
    setIsValid(false);

    if (!schemaText.trim() || !jsonText.trim()) return;

    let parsedSchema: any;
    let parsedJson: any;

    // 1. Parse JSON Schema
    try {
      parsedSchema = JSON.parse(schemaText);
    } catch (err: any) {
      setSchemaError(`Schema JSON Syntax Error: ${err.message}`);
      return;
    }

    // 2. Parse Target JSON
    try {
      parsedJson = JSON.parse(jsonText);
    } catch (err: any) {
      setJsonSyntaxError(`Target JSON Syntax Error: ${err.message}`);
      return;
    }

    // 3. Compile Schema & Validate JSON
    try {
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(parsedSchema);
      const valid = validate(parsedJson);

      if (valid) {
        setIsValid(true);
      } else {
        setValidationErrors(validate.errors || []);
      }
    } catch (err: any) {
      setSchemaError(`AJV Schema Definition Error: ${err.message}`);
    }
  }, [schemaText, jsonText]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">Schema Validator</h2>
          <p className="workspace-desc">Validate your JSON structures using JSON Schema standards in real-time.</p>
        </div>
      </div>

      {/* Validation status bar */}
      <div style={{ marginBottom: '16px' }}>
        {schemaError && (
          <div className="error-banner" style={{ margin: 0, borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <AlertTriangle size={18} />
            <div><strong>Schema Error:</strong> {schemaError}</div>
          </div>
        )}
        
        {jsonSyntaxError && !schemaError && (
          <div className="error-banner" style={{ margin: 0, borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.1)' }}>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
            <div style={{ color: theme === 'dark' ? '#fde047' : '#b45309' }}><strong>Target JSON Syntax Error:</strong> {jsonSyntaxError}</div>
          </div>
        )}

        {isValid && !schemaError && !jsonSyntaxError && (
          <div className="error-banner" style={{ margin: 0, borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.1)', color: theme === 'dark' ? '#a7f3d0' : '#065f46' }}>
            <CheckCircle size={18} style={{ color: '#10b981' }} />
            <div><strong>Success:</strong> JSON is fully compliant with the provided Schema!</div>
          </div>
        )}

        {validationErrors.length > 0 && !schemaError && !jsonSyntaxError && (
          <div className="error-banner" style={{ margin: 0, borderColor: 'rgba(239, 68, 68, 0.4)', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <XCircle size={18} style={{ color: '#ef4444' }} />
              <div><strong>Validation Failed:</strong> Found {validationErrors.length} Schema violations:</div>
            </div>
            <div style={{ marginTop: '8px', paddingLeft: '30px', width: '100%', maxHeight: '120px', overflowY: 'auto' }}>
              {validationErrors.map((err, i) => (
                <div key={i} style={{ fontSize: '12px', margin: '4px 0', fontFamily: 'monospace' }}>
                  <span style={{ color: theme === 'dark' ? '#fca5a5' : '#b91c1c' }}>{err.instancePath || '/'}</span>: {err.message} 
                  {err.params && Object.keys(err.params).length > 0 && (
                    <span style={{ opacity: 0.6, marginLeft: '6px' }}>({JSON.stringify(err.params)})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel" style={{ flex: 1 }}>
        <div className="dual-pane">
          {/* Left Editor: Schema */}
          <div className="pane-left">
            <div className="pane-header">
              <span className="pane-title">1. JSON Schema (Draft-07)</span>
              <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={12} /> Type structures
              </span>
            </div>
            <div className="pane-body">
              <Editor
                height="100%"
                language="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={schemaText}
                onChange={(val) => setSchemaText(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  fontFamily: "'Consolas', 'Courier New', monospace"
                }}
              />
            </div>
          </div>

          {/* Right Editor: Target Payload */}
          <div className="pane-right">
            <div className="pane-header">
              <span className="pane-title">2. Target JSON Payload</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Validated in real-time</span>
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
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
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
