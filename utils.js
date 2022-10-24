const superagent = require("superagent");
exports.getData = async (url, query = null) => {
  if (query !== null) {
    res = await superagent.post(url).send(query);
  } else {
    res = await superagent.get(url);
  }
  res = res.body;
  return res;
};
exports.formatChain = (chain) => {
  if (chain && chain.toLowerCase() === "xdai") return "Gnosis";
  if (chain && chain.toLowerCase() === "kcc") return "KCC";
  if (chain && chain.toLowerCase() === "okexchain") return "OKExChain";
  if (chain && chain.toLowerCase() === "bsc") return "Binance";
  return chain.charAt(0).toUpperCase() + chain.slice(1);
};

const getFormatter = (symbol) => {
  if (symbol.includes("USD+")) return /[_:\/]/g;
  return /[_+:\/]/g;
};

// replace / with - and trim potential whitespace
// set mimatic to mai, uppercase all symbols
exports.formatSymbol = (symbol) => {
  return (
    symbol
      .replace(getFormatter(symbol), "-")
      .replace(/\s/g, "")
      .trim()
      .toLowerCase()
      //    .replaceAll("mimatic", "mai")
      .toUpperCase()
  );
};
