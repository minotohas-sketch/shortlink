import React from 'react';

export function Tabs({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
