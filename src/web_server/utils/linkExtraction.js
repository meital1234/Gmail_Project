function extractLinks(text) {
  const regex = /((https?:\/\/)?(www\.)?[\w.-]+\.[a-z]{2,}(\/\S*)?)/gi;
  return text.match(regex) || [];
}

module.exports = { extractLinks };