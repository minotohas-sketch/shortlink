import React from 'react';

export function Tooltip({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
