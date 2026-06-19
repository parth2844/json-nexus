import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { FormatterView } from './components/FormatterView';
import { SchemaValidatorView } from './components/SchemaValidatorView';
import { ConverterView } from './components/ConverterView';
import { DiffView } from './components/DiffView';
import { MockGeneratorView } from './components/MockGeneratorView';
import { EscaperView } from './components/EscaperView';

function App() {
  const [activeView, setActiveView] = useState<string>('formatter');
  const [formatterCode, setFormatterCode] = useState<string>('');
  const [formatterKey, setFormatterKey] = useState<number>(0);
  
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // default theme is dark
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // Sync data-theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSendToFormatter = (jsonStr: string) => {
    setFormatterCode(jsonStr);
    setFormatterKey(prev => prev + 1);
    setActiveView('formatter');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'formatter':
        return <FormatterView key={formatterKey} initialCode={formatterCode} theme={theme} />;
      case 'schema':
        return <SchemaValidatorView theme={theme} />;
      case 'converter':
        return <ConverterView theme={theme} />;
      case 'diff':
        return <DiffView theme={theme} />;
      case 'generator':
        return <MockGeneratorView onSendToFormatter={handleSendToFormatter} theme={theme} />;
      case 'escaper':
        return <EscaperView theme={theme} />;
      default:
        return <FormatterView key={formatterKey} initialCode={formatterCode} theme={theme} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="main-workspace">
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;
