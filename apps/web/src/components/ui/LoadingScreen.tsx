export function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e0e0e0', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto' }} />
        <p style={{ marginTop: 16, color: '#666' }}>Loading...</p>
      </div>
    </div>
  );
}

export function PageLoader() {
  return <LoadingScreen />;
}

export function LoadingSpinner() {
  return (
    <div style={{ 
      width: 24, height: 24, 
      border: '3px solid #e0e0e0', 
      borderTopColor: '#6366f1', 
      borderRadius: '50%', 
      display: 'inline-block' 
    }} />
  );
}
