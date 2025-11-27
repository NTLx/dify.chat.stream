import { useEffect, useState, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidBlockProps {
  code: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

export function MermaidBlock({ code }: MermaidBlockProps) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError('Failed to render diagram');
      }
    };

    if (!showCode) {
      renderDiagram();
    }
  }, [code, showCode]);

  return (
    <div className="mermaid-block" style={{ margin: '1em 0' }}>
      {showCode ? (
        <pre className="code-view">
          <code>{code}</code>
        </pre>
      ) : error ? (
        <div className="error-message" style={{ color: '#ef4444', padding: '1em', border: '1px solid #ef4444', borderRadius: '8px' }}>
          {error}
          <pre style={{ marginTop: '0.5em', fontSize: '0.8em' }}>{code}</pre>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="diagram-view"
          dangerouslySetInnerHTML={{ __html: svg }}
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '1em',
            borderRadius: '8px',
            overflowX: 'auto',
            textAlign: 'center'
          }}
        />
      )}

      <button
        onClick={() => setShowCode(!showCode)}
        style={{
          marginTop: '0.5em',
          background: 'transparent',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '0.8em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {showCode ? (
            <>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </>
          ) : (
            <>
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </>
          )}
        </svg>
        {showCode ? 'Show Diagram' : 'Show Code'}
      </button>
    </div>
  );
}
