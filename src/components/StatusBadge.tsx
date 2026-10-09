import React from 'react';
import { getPaymentStatusLabel, getFulfillmentStatusLabel } from '../utils/formatters';

interface StatusBadgeProps {
  type: 'payment' | 'fulfillment';
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, status, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  if (type === 'payment') {
    let colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
    if (status === 'paid') {
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
    } else if (status === 'pending') {
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
    } else if (status === 'failed') {
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (status === 'expired' || status === 'cancelled') {
      colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
    }

    return (
      <span className={`inline-flex items-center rounded-full border ${colorClass} ${sizeClass}`}>
        <span
          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            status === 'paid'
              ? 'bg-emerald-500'
              : status === 'pending'
              ? 'bg-amber-500'
              : status === 'failed'
              ? 'bg-rose-500'
              : 'bg-gray-400'
          }`}
        />
        {getPaymentStatusLabel(status)}
      </span>
    );
  }

  // Fulfillment status
  let fColorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  if (status === 'processing') {
    fColorClass = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  } else if (status === 'shipped') {
    fColorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium';
  } else if (status === 'delivered') {
    fColorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
  } else if (status === 'cancelled') {
    fColorClass = 'bg-rose-50 text-rose-600 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center rounded-full border ${fColorClass} ${sizeClass}`}>
      {getFulfillmentStatusLabel(status)}
    </span>
  );
};
