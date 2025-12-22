import PropTypes from 'prop-types';
import { useTheme } from '../hooks/useTheme';

export default function StudentWorkPanel({
  showPromotionPanel,
  allPrivateStrokes,
  promoteRequests,
  onPromoteStudent,
  onToggleReveal,
  revealedStudents,
  onClose
}) {
  const { isDark } = useTheme();
  
  if (!showPromotionPanel) return null;

  return (
    <div className={`absolute top-20 right-6 w-96 max-h-[32rem] border rounded-lg shadow-lg overflow-hidden z-10 ${
      isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Panel Header */}
      <div className={`p-4 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-semibold text-sm ${
            isDark ? 'text-gray-200' : 'text-gray-800'
          }`}>Student Work</h3>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center text-sm ${
              isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="p-3 max-h-96 overflow-y-auto">
        {Object.entries(allPrivateStrokes).map(([studentId, strokes]) => (
          strokes.length > 0 && (
            <div key={studentId} className={`mb-2 p-3 border rounded-lg ${
              isDark ? 'bg-[#2a2a2a] border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'
            } transition-colors`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      isDark ? 'bg-[#5e5ce6] text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {studentId.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={`text-sm font-medium block ${
                        isDark ? 'text-gray-200' : 'text-gray-800'
                      }`}>{studentId}</span>
                    </div>
                  </div>
                  
                  {promoteRequests.some(req => req.userId === studentId) && (
                    <div className={`flex items-center gap-1.5 mt-2 px-2 py-1 rounded text-xs ${
                      isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-50 text-green-700'
                    }`}>
                      <span>🙋</span>
                      <span className="font-medium">Wants to share</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => onToggleReveal(studentId)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      revealedStudents.has(studentId)
                        ? isDark
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                        : isDark
                          ? 'bg-gray-600 hover:bg-gray-700 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {revealedStudents.has(studentId) ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    onClick={() => onPromoteStudent(studentId)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isDark 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    Show to All
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
        {Object.values(allPrivateStrokes).every(strokes => strokes.length === 0) && (
          <div className="text-center py-12">
            <div className={`text-4xl mb-2 ${
              isDark ? 'opacity-30' : 'opacity-40'
            }`}>📝</div>
            <p className={`text-sm ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}>No student work yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

StudentWorkPanel.propTypes = {
  showPromotionPanel: PropTypes.bool.isRequired,
  allPrivateStrokes: PropTypes.object.isRequired,
  promoteRequests: PropTypes.array.isRequired,
  onPromoteStudent: PropTypes.func.isRequired,
  onToggleReveal: PropTypes.func.isRequired,
  revealedStudents: PropTypes.instanceOf(Set).isRequired,
  onClose: PropTypes.func.isRequired,
};
