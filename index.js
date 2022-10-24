const { gql } = require("graphql-request");
const { request } = require("graphql-request");
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

const queryDailyPoolStatus = gql`
  {
    dailyPoolStatuses(orderBy: from, orderDirection: desc) {
      volumeUSD
      avgFeeInBps
      feeUSD
      txCount
    }
  }
`;

/**
 * APY calculation will user the pool status for the last N days.
 * (e.g: If value set to 7, it takes the latest seven-day fee yield from the subgraph)
 */
const FEE_YIELD_LAST_DAYS = 7;

const DAYS_IN_YEAR = 365;

/**  APIs url constants  */
const CLIPPER_API = "https://api.clipper.exchange";
const POOL_STATUS_API = `${CLIPPER_API}/rfq/pool`;
const SUBGRAPH_BASE_API = "https://api.thegraph.com/subgraphs/name";
const SUBGRAPH_CHAIN_API = {
  [ChainId.ETHEREUM]: `${SUBGRAPH_BASE_API}/edoapp/clipper-mainnet`,
  [ChainId.POLYGON]: `${SUBGRAPH_BASE_API}/edoapp/clipper-polygon`,
  [ChainId.OPTIMISM]: `${SUBGRAPH_BASE_API}/edoapp/clipper-optimism`
};
/** */

const getData = async (chainId) => {
  const [poolStatus, dailyPoolStatusesData] = await Promise.all([
    utils.getData(`${POOL_STATUS_API}?chain_id=${chainId}`),
    request(SUBGRAPH_CHAIN_API[chainId], queryDailyPoolStatus)
  ]);

  return {
    dailyPoolStatuses: dailyPoolStatusesData.dailyPoolStatuses,
    poolStatus
  };
};

const buildPoolInfo = (chainName, poolStatus, dailyPoolStatuses) => {
  const { value_in_usd, address } = poolStatus.pool;
  const assetSymbols = poolStatus.assets.map((asset) => asset.name).join("-");
  const formattedSymbol = utils.formatSymbol(assetSymbols);
  const composition = {};
  poolStatus.assets.forEach(
    (asset) => (composition[asset.name] = asset.balance)
  );

  const lastDaysPoolStatus = dailyPoolStatuses.slice(0, FEE_YIELD_LAST_DAYS);
  const lastDayAggStatus = lastDaysPoolStatus.reduce(
    (prev, dailyPoolStatus) => {
      return {
        totalVolume: prev.totalVolume + +dailyPoolStatus.volumeUSD,
        totalFee: prev.totalFee + +dailyPoolStatus.feeUSD
      };
    },
    { totalVolume: 0, totalFee: 0 }
  );
  const annualizedFee =
    lastDayAggStatus.totalFee * (DAYS_IN_YEAR / FEE_YIELD_LAST_DAYS);
  const apy = (annualizedFee * 100) / value_in_usd;
  return {
    pool: address,
    chain: utils.formatChain(chainName),
    project: "clipper",
    symbol: formattedSymbol,
    tvl: value_in_usd,
    apy,
    reward: 0,
    rewards: {},
    base: apy,
    composition
  };
};

const topLvl = async (chainId) => {
  const { dailyPoolStatuses, poolStatus } = await getData(chainId);
  const chainName = ChainNameById[chainId];

  return buildPoolInfo(chainName, poolStatus, dailyPoolStatuses);
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
