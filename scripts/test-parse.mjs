function parseEntityNames(text) {
  if (!text) return [];

  const names = [];

  let cleaned = text
    .replace(/^(First-line|Second-line|Third-line)[:\s]+/i, '')
    .trim();

  let contentToParse = cleaned;
  const classPrefixMatch = cleaned.match(/^(Stimulants?|Non-stimulants?|Antidepressants?|SSRIs?|SNRIs?|TCAs?|MAOIs?|FDA-approved[^:]*|ADHD symptoms?|Anxiety[^:]*|Mood[^:]*|medications?|therapies?|treatments?)\s*([:\(])/i);
  
  if (classPrefixMatch) {
    const prefix = classPrefixMatch[1];
    const separator = classPrefixMatch[2];
    
    console.log('  Matched prefix:', prefix, 'separator:', separator);
    
    if (separator === ':') {
      contentToParse = cleaned.substring(cleaned.indexOf(':') + 1).trim();
    }
  }

  console.log('  contentToParse:', contentToParse);

  // Split by commas
  const entries = [];
  let current = '';
  let depth = 0;
  
  for (let i = 0; i < contentToParse.length; i++) {
    const char = contentToParse[i];
    if (char === '(') {
      depth++;
      current += char;
    } else if (char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      entries.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    entries.push(current.trim());
  }

  console.log('  entries:', entries);

  for (const entry of entries) {
    const trimmed = entry.trim();
    
    if (trimmed.includes('(') && trimmed.includes(')')) {
      const nestedMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)/);
      if (nestedMatch) {
        const beforeParen = nestedMatch[1].trim();
        const insideParen = nestedMatch[2].trim();
        
        const beforeParenLower = beforeParen.toLowerCase();
        const isFormulationOrClass = 
          beforeParenLower.includes('salts') ||
          beforeParenLower.includes(' er') ||
          beforeParenLower.includes(' extended release') ||
          beforeParenLower.includes(' xr') ||
          beforeParenLower.includes(' ir') ||
          beforeParenLower.match(/^(ssri|snri|tca|maoi|stimulant|antidepressant|antipsychotic|anxiolytic)/i);
        
        console.log('  beforeParen:', beforeParen, 'isFormulationOrClass:', isFormulationOrClass);
        
        if (insideParen && insideParen.length > 2) {
          names.push(insideParen);
        }
        
        if (!isFormulationOrClass && beforeParen && beforeParen.length > 2) {
          names.push(beforeParen);
        }
      }
    } else {
      let cleanName = trimmed
        .replace(/\s+in\s+select\s+cases.*$/i, '')
        .replace(/\s+—.*$/, '')
        .replace(/[.,;:]+$/, '')
        .trim();
      
      if (cleanName && cleanName.length > 2) {
        names.push(cleanName);
      }
    }
  }

  return [...new Set(names.filter(name => name && name.length > 2))];
}

const testCases = [
  "Anxiety/depression: Fluoxetine (Prozac), Sertraline (Zoloft) with careful monitoring",
];

for (const test of testCases) {
  console.log('Input:', test);
  console.log('Parsed:', parseEntityNames(test));
  console.log('---');
}
