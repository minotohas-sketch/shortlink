import React from 'react';

export function StatCard({ children, className = '', ...props }: any) {
  return <div className={className} {...props}>{children}</div>;
}
