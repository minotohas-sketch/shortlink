import React from 'react';

export function Dropdown({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
