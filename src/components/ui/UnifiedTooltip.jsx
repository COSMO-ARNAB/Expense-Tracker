import React from 'react';

/**
 * Unified tooltip component for Recharts.
 * Works for both Bar and Pie charts.
 * Props: active, payload, label (optional).
 */
const resolveColor = (entry) => {
  let color = entry.color || entry.stroke || entry.fill;
  
  if (!color && entry.payload && typeof entry.payload === 'object') {
    color = entry.payload.fill || entry.payload.stroke || entry.payload.color;
  }
  
  if (color && typeof color === 'string') {
    if (!color.includes('url(')) {
      return color;
    }
    
    // Parse index from pieGrad gradient
    const match = color.match(/pieGrad-(\d+)/);
    if (match) {
      const index = parseInt(match[1], 10);
      const COLORS = [
        '#6366f1', // Indigo
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ef4444', // Rose
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#f97316', // Orange
        '#3b82f6'  // Blue
      ];
      return COLORS[index % COLORS.length];
    }
    
    // Parse color name from the gradient string itself
    const colorLower = color.toLowerCase();
    if (colorLower.includes('income')) return '#34D399'; // Green
    if (colorLower.includes('expense')) return '#FB7185'; // Red
    if (colorLower.includes('spent')) return '#6366F1'; // Violet/Indigo
    if (colorLower.includes('budget')) return '#94A3B8'; // Slate/Grey
  }
  
  // Fallback map based on name or dataKey
  const nameLower = (entry.name || '').toLowerCase();
  const keyLower = (entry.dataKey || '').toLowerCase();
  
  if (nameLower.includes('income') || keyLower.includes('income')) {
    return '#34D399'; // Green
  }
  if (nameLower.includes('expense') || keyLower.includes('expense')) {
    return '#FB7185'; // Red
  }
  if (nameLower.includes('spent') || keyLower.includes('spent')) {
    return '#6366F1'; // Violet/Indigo
  }
  if (nameLower.includes('budget') || keyLower.includes('budget')) {
    return '#94A3B8'; // Slate
  }
  
  return '#6366F1'; // Default violet fallback
};

const UnifiedTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-2xl px-4 py-3 shadow-2xl min-w-[150px] z-50">
      {label && (
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 font-black mb-2">
          {label}
        </p>
      )}
      <div className="space-y-2">
        {payload.map((entry, index) => {
          const circleColor = resolveColor(entry);
          const shadowColor = (circleColor.startsWith('#') && circleColor.length === 7)
            ? `${circleColor}73`
            : circleColor;
          
          const val = entry.value !== undefined && entry.value !== null 
            ? Number(entry.value) 
            : 0;

          return (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: circleColor,
                    boxShadow: circleColor === '#34D399'
                      ? '0 0 8px rgba(52, 211, 153, 0.45)'
                      : circleColor === '#FB7185'
                        ? '0 0 8px rgba(251, 113, 133, 0.45)'
                        : `0 0 8px ${shadowColor}`
                  }}
                />
                {entry.name}
              </span>
              <span className="font-bold text-white">
                ₹{val.toLocaleString('en-IN')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnifiedTooltip;
