export function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    </div>
  );
}

export function PageLoader() {
  return <LoadingScreen />;
}

export function LoadingSpinner() {
  return <div style={{ width: 24, height: 24, border: '3px solid #e0e0e0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />;
}
