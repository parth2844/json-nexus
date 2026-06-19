import YAML from 'yaml';

// YAML Conversions
export function yamlToJson(yamlStr: string): string {
  const parsed = YAML.parse(yamlStr);
  return JSON.stringify(parsed, null, 2);
}

export function jsonToYaml(jsonObj: any): string {
  return YAML.stringify(jsonObj);
}

// XML Conversions
export function xmlToJson(xmlStr: string): any {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
  
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error(parserError.textContent || 'XML Parsing Error');
  }
  
  function elementToObject(node: Element): any {
    if (node.children.length === 0) {
      const text = node.textContent?.trim();
      if (!text) return null;
      if (text === 'true') return true;
      if (text === 'false') return false;
      const num = Number(text);
      if (!isNaN(num) && text !== '') return num;
      return text;
    }
    
    const obj: any = {};
    
    if (node.attributes && node.attributes.length > 0) {
      obj['@attributes'] = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj['@attributes'][attr.nodeName] = attr.nodeValue;
      }
    }
    
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const name = child.nodeName;
      const childVal = elementToObject(child);
      
      if (obj[name] !== undefined) {
        if (!Array.isArray(obj[name])) {
          obj[name] = [obj[name]];
        }
        obj[name].push(childVal);
      } else {
        obj[name] = childVal;
      }
    }
    
    return obj;
  }
  
  const root = xmlDoc.documentElement;
  if (!root) return {};
  return { [root.nodeName]: elementToObject(root) };
}

export function jsonToXml(obj: any, tagName: string = 'root'): string {
  const indent = (str: string) => str.split('\n').map(line => '  ' + line).join('\n');
  
  if (obj === null || obj === undefined) {
    return `<${tagName} />`;
  }
  
  if (typeof obj !== 'object') {
    const escaped = String(obj)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    return `<${tagName}>${escaped}</${tagName}>`;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => jsonToXml(item, tagName)).join('\n');
  }
  
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    return `<${tagName} />`;
  }
  
  const children = keys.map(k => {
    const cleanKey = k.replace(/[^a-zA-Z0-9_-]/g, '_');
    const val = obj[k];
    if (Array.isArray(val)) {
      return val.map(item => jsonToXml(item, cleanKey)).join('\n');
    }
    return jsonToXml(val, cleanKey);
  }).join('\n');
  
  return `<${tagName}>\n${indent(children)}\n</${tagName}>`;
}

// Helper to flatten objects for CSV
export function flattenObject(obj: any, prefix = ''): any {
  let res: any = {};
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const keyName = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(res, flattenObject(obj[k], keyName));
      } else if (Array.isArray(obj[k])) {
        res[keyName] = JSON.stringify(obj[k]);
      } else {
        res[keyName] = obj[k];
      }
    }
  }
  return res;
}

// CSV Conversions
export function jsonToCsv(jsonVal: any): string {
  let arr: any[] = [];
  if (Array.isArray(jsonVal)) {
    arr = jsonVal;
  } else if (typeof jsonVal === 'object' && jsonVal !== null) {
    arr = [jsonVal];
  } else {
    throw new Error('Input must be a JSON array or object to convert to CSV');
  }
  
  if (arr.length === 0) return '';
  
  const flatRows = arr.map(item => flattenObject(item));
  const headersSet = new Set<string>();
  flatRows.forEach(row => {
    Object.keys(row).forEach(k => headersSet.add(k));
  });
  const headers = Array.from(headersSet);
  
  const csvRows = [];
  csvRows.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
  
  flatRows.forEach(row => {
    const values = headers.map(header => {
      const val = row[header];
      if (val === undefined || val === null) {
        return '';
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

export function csvToJson(csvStr: string): any[] {
  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvStr.length; i++) {
    const char = csvStr[i];
    const nextChar = csvStr[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField);
        currentField = '';
      } else if (char === '\r' || char === '\n') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentLine.push(currentField);
        if (currentLine.some(cell => cell !== '') || currentLine.length > 1) {
          lines.push(JSON.stringify(currentLine));
        }
        currentLine = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  if (currentField !== '' || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(JSON.stringify(currentLine));
  }
  
  if (lines.length < 2) return [];
  
  const parsedLines = lines.map(l => JSON.parse(l));
  const headers = parsedLines[0].map((h: string) => h.trim());
  const results: any[] = [];
  
  for (let i = 1; i < parsedLines.length; i++) {
    const cells = parsedLines[i];
    const rowObj: any = {};
    let empty = true;
    
    headers.forEach((header: string, index: number) => {
      const cellVal = cells[index] !== undefined ? cells[index].trim() : '';
      if (cellVal !== '') {
        empty = false;
      }
      
      const parts = header.split('.');
      let current = rowObj;
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        if (j === parts.length - 1) {
          if (cellVal === 'true') current[part] = true;
          else if (cellVal === 'false') current[part] = false;
          else if (cellVal === 'null') current[part] = null;
          else if (!isNaN(Number(cellVal)) && cellVal !== '') current[part] = Number(cellVal);
          else {
            if (cellVal.startsWith('[') && cellVal.endsWith(']')) {
              try {
                current[part] = JSON.parse(cellVal);
              } catch {
                current[part] = cellVal;
              }
            } else {
              current[part] = cellVal;
            }
          }
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
    });
    
    if (!empty) {
      results.push(rowObj);
    }
  }
  
  return results;
}

// TOML Conversions
export function jsonToToml(obj: any, prefix = ''): string {
  if (typeof obj !== 'object' || obj === null) {
    return '';
  }
  
  let result = '';
  const primitives: [string, any][] = [];
  const objects: [string, any][] = [];
  const arraysOfObjects: [string, any[]][] = [];
  
  for (const k in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      const val = obj[k];
      if (val === null || val === undefined) continue;
      
      if (typeof val !== 'object') {
        primitives.push([k, val]);
      } else if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
          arraysOfObjects.push([k, val]);
        } else {
          primitives.push([k, val]);
        }
      } else {
        objects.push([k, val]);
      }
    }
  }
  
  primitives.forEach(([k, val]) => {
    const formattedVal = formatTomlPrimitive(val);
    result += `${k} = ${formattedVal}\n`;
  });
  
  if (primitives.length > 0 && (objects.length > 0 || arraysOfObjects.length > 0)) {
    result += '\n';
  }
  
  objects.forEach(([k, val]) => {
    const tableHeader = prefix ? `${prefix}.${k}` : k;
    result += `[${tableHeader}]\n`;
    result += jsonToToml(val, tableHeader);
    result += '\n';
  });
  
  arraysOfObjects.forEach(([k, arr]) => {
    const arrayHeader = prefix ? `${prefix}.${k}` : k;
    arr.forEach(item => {
      result += `[[${arrayHeader}]]\n`;
      result += jsonToToml(item, arrayHeader);
      result += '\n';
    });
  });
  
  return result.trim();
}

function formatTomlPrimitive(val: any): string {
  if (typeof val === 'string') {
    return `"${val.replace(/"/g, '\\"')}"`;
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  if (typeof val === 'number') {
    return String(val);
  }
  if (Array.isArray(val)) {
    return `[ ${val.map(v => formatTomlPrimitive(v)).join(', ')} ]`;
  }
  return `"${String(val)}"`;
}

export function tomlToJson(tomlStr: string): any {
  const result: any = {};
  let currentScope = result;
  
  const lines = tomlStr.split('\n');
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    if (trimmed.startsWith('[[') && trimmed.endsWith(']]')) {
      const sectionName = trimmed.slice(2, -2).trim();
      const parts = sectionName.split('.');
      
      let parent = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!parent[part]) parent[part] = {};
        parent = parent[part];
      }
      
      const lastPart = parts[parts.length - 1];
      if (!parent[lastPart]) parent[lastPart] = [];
      if (!Array.isArray(parent[lastPart])) {
        parent[lastPart] = [];
      }
      
      const newObj = {};
      parent[lastPart].push(newObj);
      currentScope = newObj;
    }
    else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const sectionName = trimmed.slice(1, -1).trim();
      const parts = sectionName.split('.');
      
      let parent = result;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          if (!parent[part] || typeof parent[part] !== 'object') {
            parent[part] = {};
          }
          currentScope = parent[part];
        } else {
          if (!parent[part]) parent[part] = {};
          parent = parent[part];
        }
      }
    }
    else if (trimmed.includes('=')) {
      const eqIdx = trimmed.indexOf('=');
      const key = trimmed.slice(0, eqIdx).trim();
      const rawVal = trimmed.slice(eqIdx + 1).trim();
      
      let parsedVal: any = rawVal;
      
      if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
        parsedVal = rawVal.slice(1, -1).replace(/\\"/g, '"');
      } else if (rawVal === 'true') {
        parsedVal = true;
      } else if (rawVal === 'false') {
        parsedVal = false;
      } else if (!isNaN(Number(rawVal)) && rawVal !== '') {
        parsedVal = Number(rawVal);
      } else if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        try {
          const inner = rawVal.slice(1, -1).trim();
          if (!inner) {
            parsedVal = [];
          } else {
            parsedVal = inner.split(',').map(item => {
              const trimmedItem = item.trim();
              if (trimmedItem.startsWith('"') && trimmedItem.endsWith('"')) {
                return trimmedItem.slice(1, -1);
              }
              if (trimmedItem === 'true') return true;
              if (trimmedItem === 'false') return false;
              if (!isNaN(Number(trimmedItem)) && trimmedItem !== '') return Number(trimmedItem);
              return trimmedItem;
            });
          }
        } catch {
          parsedVal = rawVal;
        }
      }
      
      currentScope[key] = parsedVal;
    }
  });
  
  return result;
}

// Code Generation functions
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function jsonToTypeScript(val: any, interfaceName = 'RootObject'): string {
  const interfaces = new Map<string, string>();
  
  function generate(obj: any, name: string): string {
    if (obj === null || obj === undefined) return 'any';
    if (typeof obj !== 'object') return typeof obj;
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'any[]';
      const types = new Set<string>();
      obj.forEach(item => types.add(generate(item, name + 'Item')));
      const unionType = Array.from(types).join(' | ');
      return unionType.includes(' | ') ? `(${unionType})[]` : `${unionType}[]`;
    }
    
    const capitalizedName = capitalize(name);
    let subFields = '';
    const keys = Object.keys(obj);
    keys.forEach(k => {
      const cleanKey = k.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) ? k : `"${k}"`;
      const valType = generate(obj[k], name + capitalize(k));
      subFields += `  ${cleanKey}: ${valType};\n`;
    });
    
    const interfaceDef = `export interface ${capitalizedName} {\n${subFields}}`;
    interfaces.set(capitalizedName, interfaceDef);
    return capitalizedName;
  }
  
  generate(val, interfaceName);
  return Array.from(interfaces.values()).reverse().join('\n\n');
}

export function jsonToGo(val: any, structName = 'Root'): string {
  const structs = new Map<string, string>();
  
  function goCapitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
  
  function generate(obj: any, name: string): string {
    if (obj === null || obj === undefined) return 'interface{}';
    if (typeof obj === 'string') return 'string';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'int' : 'float64';
    if (typeof obj === 'boolean') return 'bool';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]interface{}';
      const elementTypes = new Set<string>();
      obj.forEach(item => elementTypes.add(generate(item, name + 'Item')));
      const chosenType = elementTypes.size === 1 ? Array.from(elementTypes)[0] : 'interface{}';
      return `[]${chosenType}`;
    }
    
    const capitalizedName = goCapitalize(name);
    let fields = '';
    const keys = Object.keys(obj);
    keys.forEach(k => {
      const goField = goCapitalize(k);
      const valType = generate(obj[k], name + goField);
      fields += `  ${goField} ${valType} \`json:"${k}"\`\n`;
    });
    
    const structDef = `type ${capitalizedName} struct {\n${fields}}`;
    structs.set(capitalizedName, structDef);
    return capitalizedName;
  }
  
  generate(val, structName);
  return Array.from(structs.values()).reverse().join('\n\n');
}

export function jsonToPython(val: any, className = 'Root'): string {
  const classes = new Map<string, string>();
  
  function pyCapitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
  
  function generate(obj: any, name: string): string {
    if (obj === null || obj === undefined) return 'Any';
    if (typeof obj === 'string') return 'str';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'int' : 'float';
    if (typeof obj === 'boolean') return 'bool';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'List[Any]';
      const elementTypes = new Set<string>();
      obj.forEach(item => elementTypes.add(generate(item, name + 'Item')));
      const chosenType = elementTypes.size === 1 ? Array.from(elementTypes)[0] : 'Any';
      return `List[${chosenType}]`;
    }
    
    const capitalizedName = pyCapitalize(name);
    let fields = '';
    const keys = Object.keys(obj);
    keys.forEach(k => {
      const pyField = k.replace(/[^a-zA-Z0-9_]/g, '_');
      const valType = generate(obj[k], name + pyCapitalize(k));
      fields += `    ${pyField}: ${valType}\n`;
    });
    
    const classDef = `@dataclass\nclass ${capitalizedName}:\n${fields || '    pass'}`;
    classes.set(capitalizedName, classDef);
    return capitalizedName;
  }
  
  generate(val, className);
  const header = `from dataclasses import dataclass\nfrom typing import List, Any, Optional\n\n`;
  return header + Array.from(classes.values()).reverse().join('\n\n');
}

export function jsonToRust(val: any, structName = 'Root'): string {
  const structs = new Map<string, string>();
  
  function rustCapitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/[^a-zA-Z0-9]/g, '');
  }
  
  function generate(obj: any, name: string): string {
    if (obj === null || obj === undefined) return 'Option<serde_json::Value>';
    if (typeof obj === 'string') return 'String';
    if (typeof obj === 'number') return Number.isInteger(obj) ? 'i64' : 'f64';
    if (typeof obj === 'boolean') return 'bool';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'Vec<serde_json::Value>';
      const elementTypes = new Set<string>();
      obj.forEach(item => elementTypes.add(generate(item, name + 'Item')));
      const chosenType = elementTypes.size === 1 ? Array.from(elementTypes)[0] : 'serde_json::Value';
      return `Vec<${chosenType}>`;
    }
    
    const capitalizedName = rustCapitalize(name);
    let fields = '';
    const keys = Object.keys(obj);
    keys.forEach(k => {
      const rustField = k.replace(/[^a-zA-Z0-9_]/g, '_');
      const keywords = ['type', 'struct', 'fn', 'let', 'mut', 'use', 'pub', 'impl', 'match', 'if', 'else', 'for', 'loop', 'while'];
      const cleanField = keywords.includes(rustField) ? `${rustField}_` : rustField;
      const valType = generate(obj[k], name + rustCapitalize(k));
      fields += `    #[serde(rename = "${k}")]\n    pub ${cleanField}: ${valType},\n`;
    });
    
    const structDef = `#[derive(Debug, Serialize, Deserialize)]\npub struct ${capitalizedName} {\n${fields}}`;
    structs.set(capitalizedName, structDef);
    return capitalizedName;
  }
  
  generate(val, structName);
  const header = `use serde::{Serialize, Deserialize};\n\n`;
  return header + Array.from(structs.values()).reverse().join('\n\n');
}
