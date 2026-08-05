import React from 'react';

export function Table({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
