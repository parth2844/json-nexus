/**
 * Evaluates standard JSONPath-like queries on a JSON object.
 * Supports:
 * - Simple keys: $.name, $.store
 * - Index access: $.items[0], $.items[1]
 * - Wildcards: $.items[*].name, $.store.*
 * - Brackets with string keys: $.items['name']
 */
export function evaluateJsonPath(obj: any, path: string): any {
  if (!path || path.trim() === '' || path.trim() === '$') {
    return obj;
  }
  
  const tokens: string[] = [];
  let current = '';
  let inBracket = false;
  
  // Strip starting $. or $
  const cleanPath = path.startsWith('$.') 
    ? path.slice(2) 
    : path.startsWith('$') 
      ? path.slice(1) 
      : path;
  
  for (let i = 0; i < cleanPath.length; i++) {
    const char = cleanPath[i];
    if (char === '[') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      inBracket = true;
    } else if (char === ']') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      inBracket = false;
    } else if (char === '.') {
      if (!inBracket) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }
  if (current) {
    tokens.push(current);
  }
  
  function resolve(currentVal: any, tokenIndex: number): any {
    if (currentVal === undefined || currentVal === null) {
      return undefined;
    }
    if (tokenIndex >= tokens.length) {
      return currentVal;
    }
    
    let token = tokens[tokenIndex].trim();
    
    // Strip quotes for key brackets like ['name'] or ["name"]
    if ((token.startsWith("'") && token.endsWith("'")) || (token.startsWith('"') && token.endsWith('"'))) {
      token = token.slice(1, -1);
    }
    
    // Wildcard query
    if (token === '*') {
      if (Array.isArray(currentVal)) {
        const results = currentVal
          .map(item => resolve(item, tokenIndex + 1))
          .filter(x => x !== undefined);
        return results.flat(1);
      } else if (typeof currentVal === 'object') {
        const results = Object.values(currentVal)
          .map(item => resolve(item, tokenIndex + 1))
          .filter(x => x !== undefined);
        return results;
      }
      return undefined;
    }
    
    // Numeric index lookup
    const index = Number(token);
    if (!isNaN(index) && Array.isArray(currentVal)) {
      return resolve(currentVal[index], tokenIndex + 1);
    }
    
    // Key-based property lookup
    if (typeof currentVal === 'object' && currentVal !== null) {
      return resolve(currentVal[token], tokenIndex + 1);
    }
    
    return undefined;
  }
  
  return resolve(obj, 0);
}

/**
 * Safely executes a custom JavaScript function against a JSON input.
 * E.g. (data) => data.users.filter(u => u.age > 21)
 */
export function evaluateJavaScriptFilter(obj: any, filterCode: string): any {
  try {
    let fnStr = filterCode.trim();
    if (!fnStr.includes('return') && !fnStr.startsWith('(') && !fnStr.startsWith('function')) {
      fnStr = `return (${fnStr})`;
    }
    
    if (!fnStr.startsWith('(') && !fnStr.startsWith('function')) {
      // eslint-disable-next-line no-new-func
      const fn = new Function('data', fnStr);
      return fn(obj);
    } else {
      // eslint-disable-next-line no-new-func
      const fn = new Function('data', `return (${fnStr})(data)`);
      return fn(obj);
    }
  } catch (err: any) {
    throw new Error(`Filter Error: ${err.message}`);
  }
}
