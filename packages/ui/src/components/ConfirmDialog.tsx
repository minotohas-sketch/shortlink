import React from 'react';

export function ConfirmDialog({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
