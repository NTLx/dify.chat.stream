import { useState, useEffect } from 'react';

interface ThinkBlockProps {
  content: string;
  isStreaming: boolean;
}

export function ThinkBlock({ content, isStreaming }: ThinkBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isManuallyControlled, setIsManuallyControlled] = useState(false);

  useEffect(() => {
    if (isStreaming) {
      // 流式输出时自动展开
      setIsExpanded(true);
      setIsManuallyControlled(false);
    } else if (!isManuallyControlled && isExpanded) {
      // 流式输出完成后，延迟 2s 自动折叠
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isStreaming, isManuallyControlled, isExpanded]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    setIsManuallyControlled(true);
  };

  return (
    <div 
      className={`think-block ${isExpanded ? 'expanded' : 'collapsed'} ${isStreaming ? 'streaming' : ''}`}
      onClick={!isExpanded ? handleToggle : undefined}
    >
      <div className="think-block-header" onClick={isExpanded ? handleToggle : undefined}>
        <span className="icon">💭</span>
        <span className="label">思考中</span>
        {!isExpanded && <span className="hint">点击展开</span>}
      </div>
      <div className="think-block-content">
        {content}
      </div>
    </div>
  );
}
