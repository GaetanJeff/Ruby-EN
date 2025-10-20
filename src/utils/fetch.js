// Migration helper for node-fetch v3
// This file helps with the transition from node-fetch v2 to v3

const fetchWrapper = async (...args) => {
  const { default: fetch } = await import('node-fetch');
  return fetch(...args);
};

module.exports = fetchWrapper;
