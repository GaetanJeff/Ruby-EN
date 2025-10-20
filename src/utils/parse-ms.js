// Migration helper for parse-ms v4
// parse-ms v4 now exports as { default } and has different API

const parseMs = async (ms) => {
  const { default: parseMilliseconds } = await import('parse-ms');
  return parseMilliseconds(ms);
};

module.exports = parseMs;
