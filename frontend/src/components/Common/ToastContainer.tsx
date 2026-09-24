import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let className = 'toast-item toast-success';

        if (toast.type === 'info') {
          Icon = Info;
          className = 'toast-item toast-info';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          className = 'toast-item toast-warning';
        } else if (toast.type === 'error') {
          Icon = XCircle;
          className = 'toast-item toast-warning';
        }

        return (
          <div key={toast.id} className={className}>
            <Icon size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: 2 }}>
                {toast.title}
              </strong>
              <p style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.4, margin: 0, color: 'inherit' }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                color: 'inherit',
                opacity: 0.7,
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
