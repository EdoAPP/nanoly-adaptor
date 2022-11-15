const utils = require("./utils");
const ChainId = {
  ETHEREUM: 1,
  POLYGON: 137,
  OPTIMISM: 10
};

const ChainNameById = {
  [ChainId.ETHEREUM]: "ethereum",
  [ChainId.POLYGON]: "polygon",
  [ChainId.OPTIMISM]: "optimism"
};

/**  APIs url constants  */
const CLIPPER_POOL_API = "https://clipper.exchange/api/apy";
/** */

const getData = async (chainId) => {
  const poolStatus = await utils.getData(`${CLIPPER_POOL_API}?chain=${chainId}`);
  return poolStatus;
};

const buildPoolInfo = (chainName, poolStatus) => {
  const { value_in_usd, address } = poolStatus.pool;
  const assetSymbols = poolStatus.assets.map((asset) => asset.name).join("-");
  const formattedSymbol = utils.formatSymbol(assetSymbols);
  const composition = {};
  poolStatus.assets.forEach(
    (asset) => (composition[asset.name] = asset.balance)
  );

  return {
    pool: address,
    chain: utils.formatChain(chainName),
    project: "clipper",
    symbol: formattedSymbol,
    tvl: value_in_usd,
    apy: poolStatus.adjustedApy,
    reward: 0,
    rewards: {},
    base: poolStatus.adjustedApy,
    composition
  };
};

const topLvl = async (chainId) => {
  const poolStatus = await getData(chainId);
  const chainName = ChainNameById[chainId];

  return buildPoolInfo(chainName, poolStatus);
};

const main = async () => {
  const data = await Promise.all([
    topLvl(ChainId.ETHEREUM),
    topLvl(ChainId.POLYGON),
    topLvl(ChainId.OPTIMISM)
  ]);

  return data;
};

(async () => {
  console.log(await main());
})();
