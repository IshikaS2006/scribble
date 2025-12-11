const crypto = require('crypto');

/**
 * Generate a secure admin key
 * @returns {string} 32-character hexadecimal string
 */
const generateAdminKey = () => {
  return crypto.randomBytes(16).toString('hex');
};

module.exports = {
  generateAdminKey
};
