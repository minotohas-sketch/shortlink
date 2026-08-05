import React from 'react';

export function Badge({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
