import PropTypes from 'prop-types';
import { useTheme } from '../hooks/useTheme';

function JoinRoomForm({ 
  isConnected, 
  error, 
  roomId, 
  setRoomId, 
  adminKey, 
  setAdminKey, 
  userId, 
  setUserId, 
  handleJoinRoom, 
  createTestRoom,
  isCreatingRoom
}) {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center `}>
      <div className={`w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden '}`}>
        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Form */}
          <div className="flex-1 p-8 lg:p-12">
            {/* Logo Section */}
            <div className=''>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src="/logo/coworking-vector-icon-outline-600w-1807246411.png" 
                  alt="ShadowDraw Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  ShadowDraw
                </h1>
                <p className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Collaborative Whiteboard
                </p>
              </div>
            </div></div>

            {/* Connection Status */}
            {!isConnected && (
              <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                isDark ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent"></div>
                <span className={`text-sm font-medium ${
                  isDark ? 'text-yellow-400' : 'text-yellow-700'
                }`}>Connecting to server...</span>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
              }`}>
                <span className="text-red-500">⚠</span>
                <span className={`text-sm font-medium ${
                  isDark ? 'text-red-400' : 'text-red-700'
                }`}>{error}</span>
              </div>
            )}

            {/* Create Test Room Button */}
            <button
              onClick={createTestRoom}
              className={`w-full mb-6 px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
              }`}
              disabled={!isConnected || isCreatingRoom}
            >
              {isCreatingRoom ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating Room...
                </span>
              ) : (
                '✨ Create Test Room (as Teacher)'
              )}
            </button>

            {/* Success message */}
            {adminKey && roomId && (
              <div className={`mb-6 p-4 rounded-lg ${
                isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <div>
                    <p className={`text-sm font-semibold ${
                      isDark ? 'text-green-400' : 'text-green-700'
                    }`}>
                      Room created successfully!
                    </p>
                    <p className={`text-xs mt-1 ${
                      isDark ? 'text-green-300' : 'text-green-600'
                    }`}>
                      You are joining as a <strong>Teacher</strong>. Enter your name and click Join Room.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Join Form */}
            <form onSubmit={handleJoinRoom} className="space-y-5">
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <span className="text-lg">🔑</span>
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="571036"
                  className={`w-full px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDark 
                      ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
              </div>

              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <span className="text-lg">👑</span>
                  Administrator Key
                  {adminKey && (
                    <span className={`text-xs font-normal ${
                      isDark ? 'text-green-400' : 'text-green-600'
                    }`}>
                      (You are Teacher)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Leave empty for student, or paste admin key"
                  className={`w-full px-2 py-1 rounded-lg focus:outline-none transition ${
                    adminKey 
                      ? isDark 
                        ? 'bg-green-500/10 border-2 border-green-500/30 text-green-400' 
                        : 'bg-green-50 border-2 border-green-300 text-green-700'
                      : isDark
                        ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'
                  }`}
                  readOnly={!!adminKey}
                />
              </div>

              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <span className="text-lg">👤</span>
                  Your Name
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="John Williams"
                  className={`w-full px-2 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDark 
                      ? 'bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!isConnected}
                className={`w-full px-4 py-2 rounded-md font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                }`}
              >
                Join Room →
              </button>
            </form>

            <p className={`text-center text-xs mt-6 ${
              isDark ? 'text-gray-500' : 'text-gray-500'
            }`}>
              By joining, you agree to our{' '}
              <a href="#" className={`hover:underline ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                terms of service
              </a>
            </p>
          </div>

          {/* Right Side - Illustration */}
          <div className={`hidden lg:flex flex-1 items-center justify-center p-8 ${
            isDark ? 'bg-gradient-to-br from-gray-900/50 to-gray-800/50' : 'bg-gradient-to-br from-blue-50 to-purple-50'
          }`}>
            <div className="max-w-md">
              <img 
                src="/joinroom-img.png" 
                alt="Interview Room" 
                className="w-full h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

JoinRoomForm.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  error: PropTypes.string,
  roomId: PropTypes.string.isRequired,
  setRoomId: PropTypes.func.isRequired,
  adminKey: PropTypes.string,
  setAdminKey: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  setUserId: PropTypes.func.isRequired,
  handleJoinRoom: PropTypes.func.isRequired,
  createTestRoom: PropTypes.func.isRequired,
  isCreatingRoom: PropTypes.bool,
};

JoinRoomForm.defaultProps = {
  error: null,
  adminKey: '',
  isCreatingRoom: false,
};

export default JoinRoomForm;
