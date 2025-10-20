// Migration helper for chalk v5
// chalk v5 is now ES module only

const createChalk = async () => {
  const { default: chalk } = await import('chalk');
  return chalk;
};

// Create a synchronous-like interface
let chalkInstance = null;

const initializeChalk = async () => {
  if (!chalkInstance) {
    chalkInstance = await createChalk();
  }
  return chalkInstance;
};

// For immediate use cases, we'll need to initialize chalk first
module.exports = {
  initializeChalk,
  // Provide a getter that throws if not initialized
  get chalk() {
    if (!chalkInstance) {
      throw new Error('Chalk not initialized. Call initializeChalk() first.');
    }
    return chalkInstance;
  }
};
