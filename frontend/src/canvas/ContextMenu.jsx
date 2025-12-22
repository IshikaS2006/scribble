import PropTypes from 'prop-types';
import { useTheme } from '../hooks/useTheme';
import { useEffect } from 'react';

export default function ContextMenu({ 
  show, 
  x, 
  y, 
  selectedStrokes,
  onDuplicate,
  onDelete,
  onChangeColor,
  onChangeWidth,
  onBringToFront,
  onSendToBack,
  onClose 
}) {
  const { isDark } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (show) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape' && show) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show, onClose]);

  if (!show || !selectedStrokes || selectedStrokes.length === 0) return null;

  const menuItems = [
    {
      label: 'Duplicate',
      shortcut: 'Ctrl+D',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      ),
      onClick: onDuplicate,
    },
    {
      label: 'Delete',
      shortcut: 'Del',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      ),
      onClick: onDelete,
      danger: true,
    },
    { divider: true },
    {
      label: 'Change Color',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 2v20"></path>
        </svg>
      ),
      submenu: true,
      colors: ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'],
      onColorSelect: onChangeColor,
    },
    {
      label: 'Stroke Width',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      submenu: true,
      widths: [1, 2, 4, 6, 8],
      onWidthSelect: onChangeWidth,
    },
    { divider: true },
    {
      label: 'Bring to Front',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="17 11 12 6 7 11"></polyline>
          <polyline points="17 18 12 13 7 18"></polyline>
        </svg>
      ),
      onClick: onBringToFront,
    },
    {
      label: 'Send to Back',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="7 13 12 18 17 13"></polyline>
          <polyline points="7 6 12 11 17 6"></polyline>
        </svg>
      ),
      onClick: onSendToBack,
    },
  ];

  return (
    <div
      className={`fixed z-[200] min-w-[200px] rounded-lg shadow-2xl border backdrop-blur-sm ${
        isDark 
          ? 'bg-[#1e1e1e]/95 border-gray-700' 
          : 'bg-white/95 border-gray-200'
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="py-1">
        {menuItems.map((item, index) => {
          if (item.divider) {
            return (
              <div
                key={`divider-${index}`}
                className={`my-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
              />
            );
          }

          if (item.submenu && item.colors) {
            return (
              <div key={index} className="px-2 py-2">
                <div className={`text-xs font-medium mb-2 px-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.label}
                </div>
                <div className="flex flex-wrap gap-2 px-2">
                  {item.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        item.onColorSelect(color);
                        onClose();
                      }}
                      className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                        isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            );
          }

          if (item.submenu && item.widths) {
            return (
              <div key={index} className="px-2 py-2">
                <div className={`text-xs font-medium mb-2 px-2 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {item.label}
                </div>
                <div className="flex gap-2 px-2">
                  {item.widths.map((width) => (
                    <button
                      key={width}
                      onClick={() => {
                        item.onWidthSelect(width);
                        onClose();
                      }}
                      className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                        isDark 
                          ? 'hover:bg-[#2a2a2a]' 
                          : 'hover:bg-gray-100'
                      }`}
                      title={`${width}px`}
                    >
                      <div 
                        className={`rounded-full ${
                          isDark ? 'bg-gray-400' : 'bg-gray-600'
                        }`}
                        style={{ width: `${width * 2}px`, height: `${width * 2}px` }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`w-full px-4 py-2 flex items-center gap-3 text-sm transition-colors ${
                item.danger
                  ? isDark
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-red-600 hover:bg-red-50'
                  : isDark
                    ? 'text-gray-300 hover:bg-[#2a2a2a]'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <span className={`text-xs ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {item.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection Info */}
      <div className={`px-4 py-2 text-xs border-t ${
        isDark 
          ? 'border-gray-700 text-gray-500' 
          : 'border-gray-200 text-gray-500'
      }`}>
        {selectedStrokes.length} item{selectedStrokes.length > 1 ? 's' : ''} selected
      </div>
    </div>
  );
}

ContextMenu.propTypes = {
  show: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  selectedStrokes: PropTypes.array.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onChangeColor: PropTypes.func.isRequired,
  onChangeWidth: PropTypes.func.isRequired,
  onBringToFront: PropTypes.func.isRequired,
  onSendToBack: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
