import React from 'react';

export function Card({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
