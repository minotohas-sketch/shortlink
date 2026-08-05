import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(label ? `${label} copied!` : 'Copied to clipboard!');
      
      setTimeout(() => setCopied(false), resetDelay);
    } catch {
      // Fallback pour les navigateurs sans clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        toast.success(label ? `${label} copied!` : 'Copied to clipboard!');
        setTimeout(() => setCopied(false), resetDelay);
      } catch {
        toast.error('Failed to copy');
      }
      
      document.body.removeChild(textarea);
    }
  }, [resetDelay]);

  return { copied, copy };
}
