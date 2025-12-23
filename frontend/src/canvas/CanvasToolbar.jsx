import PropTypes from 'prop-types';
import { useTheme } from '../hooks/useTheme';

export default function CanvasToolbar({
  isAdmin,
  userCount,
  selectedColor,
  setSelectedColor,
  selectedWidth,
  setSelectedWidth,
  selectedTool,
  setSelectedTool,
  privateStrokes,
  allPrivateStrokes,
  promoteRequests,
  onTogglePromotionPanel,
  showPromotionPanel,
  onSaveAsPNG,
  onLeaveRoom,
  viewingStudentId,
  setViewingStudentId
}) {
  const { isDark } = useTheme();

  const tools = [
    { id: 'select', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
        <path d="M13 13l6 6"></path>
      </svg>
    ), title: 'Select / Pointer (Default)' },
    { id: 'freehand', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
        <path d="M2 2l7.586 7.586"></path>
      </svg>
    ), title: 'Draw' },
    { id: 'rectangle', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      </svg>
    ), title: 'Rectangle' },
    { id: 'circle', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    ), title: 'Circle' },
    { id: 'line', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="5" y1="19" x2="19" y2="5"></line>
      </svg>
    ), title: 'Line' },
    { id: 'arrow', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    ), title: 'Arrow (Filled)' },
    { id: 'arrow-line', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6l4.153 11.793a0.365 .365 0 0 0 .331 .207a0.366 .366 0 0 0 .332 -.207l2.184 -4.793l4.787 -1.994a0.355 .355 0 0 0 .213 -.323a0.355 .355 0 0 0 -.213 -.323l-11.787 -4.36z"></path>
      </svg>
    ), title: 'Arrow (Cursor)' },
    { id: 'text', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 7 4 4 20 4 20 7"></polyline>
        <line x1="9" y1="20" x2="15" y2="20"></line>
        <line x1="12" y1="4" x2="12" y2="20"></line>
      </svg>
    ), title: 'Text' },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
      <div className={`flex items-center gap-3 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm ${
        isDark ? 'bg-[#1e1e1e]/95' : 'bg-white/95'
      }`}>
        {/* Tool Buttons */}
        <div className={`flex items-center gap-1 px-2 py-2 rounded-lg ${
          isDark ? 'bg-[#1e1e1e]' : 'bg-gray-100'
        }`}>
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool.id)}
              className={`w-10 h-10 flex items-center justify-center rounded transition-all ${
                selectedTool === tool.id
                  ? isDark
                    ? 'bg-[#5e5ce6] text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                    : 'text-gray-600 hover:bg-gray-200'
              }`}
              title={tool.title}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Color Picker */}
        <div className={`px-3 py-2 rounded-lg ${
          isDark ? 'bg-[#1e1e1e]' : 'bg-gray-100'
        }`}>
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => setSelectedColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0"
            title="Stroke color"
            style={{
              background: selectedColor,
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
            }}
          />
        </div>

        {/* Stroke Width */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          isDark ? 'bg-[#1e1e1e]' : 'bg-gray-100'
        }`}>
          {[1, 2, 4, 6].map(width => (
            <button
              key={width}
              onClick={() => setSelectedWidth(width)}
              className={`w-8 h-8 flex items-center justify-center rounded transition-all ${
                selectedWidth === width
                  ? isDark
                    ? 'bg-[#5e5ce6]'
                    : 'bg-blue-500'
                  : isDark
                    ? 'hover:bg-[#2a2a2a]'
                    : 'hover:bg-gray-200'
              }`}
              title={`${width}px`}
            >
              <div 
                className={`rounded-full ${
                  selectedWidth === width ? 'bg-white' : isDark ? 'bg-gray-400' : 'bg-gray-600'
                }`}
                style={{ width: `${width * 2}px`, height: `${width * 2}px` }}
              />
            </button>
          ))}
        </div>

        {/* Save PNG */}
        <button
          onClick={onSaveAsPNG}
          className={`px-4 h-10 flex items-center gap-2 rounded-lg font-medium text-sm transition-all ${
            isDark 
              ? 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a]' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Save as PNG"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          <span>Save</span>
        </button>

        {/* Admin Student Selector */}
        {isAdmin && (
          <div className={`px-3 py-2 rounded-lg ${
            isDark ? 'bg-[#1e1e1e]' : 'bg-gray-100'
          }`}>
            <select
              value={viewingStudentId || 'own'}
              onChange={(e) => setViewingStudentId(e.target.value === 'own' ? null : e.target.value)}
              className={`px-3 py-1.5 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-[#2a2a2a] border border-gray-600 text-gray-300' 
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
              title="Select which student's work to view"
            >
              <option value="own">View: Own</option>
              {Object.keys(allPrivateStrokes).map(studentId => (
                allPrivateStrokes[studentId].length > 0 && (
                  <option key={studentId} value={studentId}>
                    View: {studentId}
                  </option>
                )
              ))}
            </select>
          </div>
        )}

        {/* Divider */}
        <div className={`w-px h-6 ${isDark ? 'bg-gray-700' : 'bg-gray-300'}`}></div>

        {/* User Count & Role */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          isDark ? 'bg-[#1e1e1e] text-gray-300' : 'bg-gray-100 text-gray-700'
        }`}
        title={`${userCount} user${userCount !== 1 ? 's' : ''} connected`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span className="font-medium">{userCount}</span>
        </div>

        {/* Leave Room */}
        <button
          onClick={onLeaveRoom}
          className={`px-4 h-10 flex items-center gap-2 rounded-lg font-medium text-sm transition-all ${
            isDark 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
}

CanvasToolbar.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  userCount: PropTypes.number.isRequired,
  selectedColor: PropTypes.string.isRequired,
  setSelectedColor: PropTypes.func.isRequired,
  selectedWidth: PropTypes.number.isRequired,
  setSelectedWidth: PropTypes.func.isRequired,
  selectedTool: PropTypes.string.isRequired,
  setSelectedTool: PropTypes.func.isRequired,
  privateStrokes: PropTypes.array.isRequired,
  allPrivateStrokes: PropTypes.object.isRequired,
  promoteRequests: PropTypes.array.isRequired,
  onTogglePromotionPanel: PropTypes.func.isRequired,
  showPromotionPanel: PropTypes.bool.isRequired,
  onSaveAsPNG: PropTypes.func.isRequired,
  onLeaveRoom: PropTypes.func.isRequired,
  viewingStudentId: PropTypes.string,
  setViewingStudentId: PropTypes.func.isRequired,
};
