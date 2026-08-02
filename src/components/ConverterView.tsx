import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Copy, 
  Check, 
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { 
  yamlToJson, 
  jsonToYaml, 
  xmlToJson, 
  jsonToXml, 
  csvToJson, 
  jsonToCsv, 
  tomlToJson, 
  jsonToToml,
  jsonToTypeScript,
  jsonToGo,
  jsonToPython,
  jsonToRust
} from '../utils/converters';

const SAMPLE_JSON = `{
  "project": "JSON Nexus",
  "version": 1.0,
  "active": true,
  "tags": ["conversion", "code-gen"],
  "settings": {
    "theme": "dark",
    "port": 3000
  },
  "contributors": [
    { "name": "Alex", "role": "Lead" },
    { "name": "Sam", "role": "Designer" }
  ]
}`;

const SAMPLE_YAML = `project: JSON Nexus
version: 1
active: true
tags:
  - conversion
  - code-gen
settings:
  theme: dark
  port: 3000
contributors:
  - name: Alex
    role: Lead
  - name: Sam
    role: Designer`;

const SAMPLE_XML = `<root>
  <project>JSON Nexus</project>
  <version>1</version>
  <active>true</active>
  <tags>conversion</tags>
  <tags>code-gen</tags>
  <settings>
    <theme>dark</theme>
    <port>3000</port>
  </settings>
  <contributors>
    <name>Alex</name>
    <role>Lead</role>
  </contributors>
  <contributors>
    <name>Sam</name>
    <role>Designer</role>
  </contributors>
</root>`;

const SAMPLE_CSV = `"project","version","active","tags","settings.theme","settings.port"
"JSON Nexus",1,true,"[""conversion"",""code-gen""]","dark",3000`;

const SAMPLE_TOML = `project = "JSON Nexus"
version = 1
active = true
tags = [ "conversion", "code-gen" ]

[settings]
theme = "dark"
port = 3000

[[contributors]]
name = "Alex"
role = "Lead"

[[contributors]]
name = "Sam"
role = "Designer"`;

interface ConverterViewProps {
  theme: 'dark' | 'light';
}

export const ConverterView: React.FC<ConverterViewProps> = ({ theme }) => {
  // Mode tabs: 'data' | 'codegen'
  const [activeTab, setActiveTab] = useState<'data' | 'codegen'>('data');
  
  // Active Format Option
  // For 'data': 'yaml' | 'xml' | 'csv' | 'toml'
  const [dataFormat, setDataFormat] = useState<string>('yaml');
  // Direction: true means JSON -> Format, false means Format -> JSON
  const [isJsonToFormat, setIsJsonToFormat] = useState<boolean>(true);

  // For 'codegen': 'typescript' | 'go' | 'python' | 'rust'
  const [codegenFormat, setCodegenFormat] = useState<string>('typescript');

  // Input / Output texts
  const [inputText, setInputText] = useState<string>(SAMPLE_JSON);
  const [outputText, setOutputText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Synchronize sample load on format changes
  const loadSampleData = (format: string, jsonToFmt: boolean) => {
    setError(null);
    if (jsonToFmt) {
      setInputText(SAMPLE_JSON);
    } else {
      switch (format) {
        case 'yaml': setInputText(SAMPLE_YAML); break;
        case 'xml': setInputText(SAMPLE_XML); break;
        case 'csv': setInputText(SAMPLE_CSV); break;
        case 'toml': setInputText(SAMPLE_TOML); break;
        default: setInputText('');
      }
    }
  };

  // Trigger load when configuration changes
  useEffect(() => {
    loadSampleData(dataFormat, isJsonToFormat);
  }, [dataFormat, isJsonToFormat]);

  useEffect(() => {
    if (activeTab === 'codegen') {
      setInputText(SAMPLE_JSON);
    }
  }, [activeTab]);

  // Run Conversion logic
  useEffect(() => {
    if (!inputText.trim()) {
      setOutputText('');
      setError(null);
      return;
    }

    try {
      if (activeTab === 'data') {
        if (isJsonToFormat) {
          // Parse input JSON first
          const parsed = JSON.parse(inputText);
          
          let result = '';
          if (dataFormat === 'yaml') result = jsonToYaml(parsed);
          else if (dataFormat === 'xml') result = jsonToXml(parsed);
          else if (dataFormat === 'csv') result = jsonToCsv(parsed);
          else if (dataFormat === 'toml') result = jsonToToml(parsed);
          
          setOutputText(result);
        } else {
          // Format -> JSON
          let result = '';
          if (dataFormat === 'yaml') result = yamlToJson(inputText);
          else if (dataFormat === 'xml') result = JSON.stringify(xmlToJson(inputText), null, 2);
          else if (dataFormat === 'csv') result = JSON.stringify(csvToJson(inputText), null, 2);
          else if (dataFormat === 'toml') result = JSON.stringify(tomlToJson(inputText), null, 2);
          
          setOutputText(result);
        }
      } else {
        // CodeGen: always expect JSON input
        const parsed = JSON.parse(inputText);
        let result = '';
        
        if (codegenFormat === 'typescript') result = jsonToTypeScript(parsed);
        else if (codegenFormat === 'go') result = jsonToGo(parsed);
        else if (codegenFormat === 'python') result = jsonToPython(parsed);
        else if (codegenFormat === 'rust') result = jsonToRust(parsed);
        
        setOutputText(result);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setOutputText('');
    }
  }, [inputText, dataFormat, isJsonToFormat, codegenFormat, activeTab]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine Editor languages
  const getInputLanguage = () => {
    if (activeTab === 'codegen') return 'json';
    return isJsonToFormat ? 'json' : dataFormat;
  };

  const getOutputLanguage = () => {
    if (activeTab === 'codegen') {
      if (codegenFormat === 'typescript') return 'typescript';
      if (codegenFormat === 'go') return 'go';
      if (codegenFormat === 'python') return 'python';
      if (codegenFormat === 'rust') return 'rust';
    }
    return isJsonToFormat ? dataFormat : 'json';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="workspace-header">
        <div>
          <h2 className="workspace-title">Conversion & CodeGen</h2>
          <p className="workspace-desc">Interconvert formats (YAML, XML, CSV, TOML) or instantly compile source code models.</p>
        </div>
      </div>

      {/* Main selection Toolbar */}
      <div className="query-panel" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="view-tabs">
            <button 
              className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              Data Converter
            </button>
            <button 
              className={`tab-btn ${activeTab === 'codegen' ? 'active' : ''}`}
              onClick={() => setActiveTab('codegen')}
            >
              Code Generator
            </button>
          </div>

          {activeTab === 'data' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select 
                className="form-input"
                style={{ padding: '6px 12px' }}
                value={dataFormat} 
                onChange={(e) => setDataFormat(e.target.value)}
              >
                <option value="yaml">YAML</option>
                <option value="xml">XML</option>
                <option value="csv">CSV (Flat Array)</option>
                <option value="toml">TOML</option>
              </select>
              
              <button 
                className="btn btn-sm"
                onClick={() => setIsJsonToFormat(!isJsonToFormat)}
                title="Switch conversion direction"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowRightLeft size={14} />
                <span>{isJsonToFormat ? 'JSON ➔ Target' : 'Target ➔ JSON'}</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Target Language:</span>
              <select 
                className="form-input"
                style={{ padding: '6px 12px' }}
                value={codegenFormat} 
                onChange={(e) => setCodegenFormat(e.target.value)}
              >
                <option value="typescript">TypeScript Interfaces</option>
                <option value="go">Go Structs</option>
                <option value="python">Python Dataclasses</option>
                <option value="rust">Rust Structs (Serde)</option>
              </select>
            </div>
          )}
        </div>
        
        <div>
          <button className="btn btn-sm" onClick={() => loadSampleData(dataFormat, isJsonToFormat)}>
            Reset Sample
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <div><strong>Parsing/Conversion Error:</strong> {error}</div>
        </div>
      )}

      {/* Editor Split */}
      <div className="glass-panel" style={{ flex: 1 }}>
        <div className="dual-pane">
          {/* Input Panel */}
          <div className="pane-left">
            <div className="pane-header">
              <span className="pane-title">Source Input ({getInputLanguage().toUpperCase()})</span>
            </div>
            <div className="pane-body">
              <Editor
                height="100%"
                language={getInputLanguage()}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={inputText}
                onChange={(val) => setInputText(val || '')}
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

          {/* Output Panel */}
          <div className="pane-right">
            <div className="pane-header">
              <span className="pane-title">Generated Output ({getOutputLanguage().toUpperCase()})</span>
              <button className="btn btn-sm" onClick={handleCopy} disabled={!outputText}>
                {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="pane-body">
              <Editor
                height="100%"
                language={getOutputLanguage()}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={outputText}
                options={{
                  readOnly: true,
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
        </div>
      </div>
    </div>
  );
};
