import React, { useState, useEffect, useCallback } from 'react';

let toastFn = null;

export function useToast() {
  return toastFn;
}

export function toast(message, type = 'info', duration = 4000) {
  if (toastFn) toastFn(message, type, duration);
  else alert(message); // fallback
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  useEffect(() => { toastFn = addToast; return () => { toastFn = null; }; }, [addToast]);

  const colors = {
    success: { bg: '#f0fdf4', border: '#16a34a', text: '#15803d', icon: '✅' },
    error:   { bg: '#fef2f2', border: '#dc2626', text: '#dc2626', icon: '❌' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#b45309', icon: '⚠️' },
    info:    { bg: '#eff6ff', border: '#1e40af', text: '#1e40af', icon: 'ℹ️' }
  };

  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8, maxWidth:380 }}>
      {toasts.map(t => {
        const c = colors[t.type] || colors.info;
        return (
          <div key={t.id} style={{ background:c.bg, border:'1px solid '+c.border, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:10, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', animation:'slideIn 0.2s ease' }}>
            <span style={{ fontSize:16 }}>{c.icon}</span>
            <span style={{ fontSize:13, color:c.text, flex:1, lineHeight:1.4 }}>{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background:'none', border:'none', cursor:'pointer', color:c.text, fontSize:16, padding:0, lineHeight:1 }}>×</button>
          </div>
        );
      })}
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}
