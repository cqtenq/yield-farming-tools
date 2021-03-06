import { ethers } from 'ethers'
import {
  ERC20_ABI,
  SXAU_TOKEN_ADDR,
  SYNTH_UNIV2_SXAU_STAKING_POOL_ABI,
  SYNTH_UNIV2_SXAU_STAKING_POOL_ADDR,
  UNISWAP_SXAU_USDC_POOL_ABI,
  UNISWAP_SXAU_USDC_POOL_ADDR,
  USDC_ADDRESS,
} from '../../../constants'
import { get_synth_weekly_rewards, lookUpPrices, toFixed } from '../../../utils'

export default async function main(App) {
  const SYNTH_UNIV2_SXAU_USDC_STAKING_POOL = new ethers.Contract(
    SYNTH_UNIV2_SXAU_STAKING_POOL_ADDR,
    SYNTH_UNIV2_SXAU_STAKING_POOL_ABI,
    App.provider
  )
  const UNISWAPV2_SXAU_USDC_POOL = new ethers.Contract(
    UNISWAP_SXAU_USDC_POOL_ADDR,
    UNISWAP_SXAU_USDC_POOL_ABI,
    App.provider
  )
  const SXAU_CONTRACT = new ethers.Contract(
    SXAU_TOKEN_ADDR,
    ERC20_ABI,
    App.provider
  )
  const USDC_CONTRACT = new ethers.Contract(
    USDC_ADDRESS,
    ERC20_ABI,
    App.provider
  )

  // SYNTH Staking Pool
  const yourStakedUniv2Amount =
    (await SYNTH_UNIV2_SXAU_USDC_STAKING_POOL.balanceOf(App.YOUR_ADDRESS)) /
    1e18
  const earnedSNX =
    (await SYNTH_UNIV2_SXAU_USDC_STAKING_POOL.earned(App.YOUR_ADDRESS)) / 1e18

  // Uniswap V2 sXAU-usdc Pool
  const totalUniv2SXAUUSDCTokenSupply =
    (await UNISWAPV2_SXAU_USDC_POOL.totalSupply()) / 1e18

  const totalStakedUniv2SXAUUSDCTokenAmount =
    (await UNISWAPV2_SXAU_USDC_POOL.balanceOf(
      SYNTH_UNIV2_SXAU_STAKING_POOL_ADDR
    )) / 1e18

  const stakingPoolPercentage =
    (100 * yourStakedUniv2Amount) / totalStakedUniv2SXAUUSDCTokenAmount

  const totalSXAUAmount =
    (await SXAU_CONTRACT.balanceOf(UNISWAP_SXAU_USDC_POOL_ADDR)) / 1e18
  const totalUSDCAmount =
    (await USDC_CONTRACT.balanceOf(UNISWAP_SXAU_USDC_POOL_ADDR)) / 1e6

  const SXAUPerToken = totalSXAUAmount / totalUniv2SXAUUSDCTokenSupply
  const USDCPerToken = totalUSDCAmount / totalUniv2SXAUUSDCTokenSupply

  // Find out reward rate
  const weekly_reward = await get_synth_weekly_rewards(
    SYNTH_UNIV2_SXAU_USDC_STAKING_POOL
  )
  const rewardPerToken = weekly_reward / totalStakedUniv2SXAUUSDCTokenAmount

  // CoinGecko price lookup
  const prices = await lookUpPrices(['havven', 'sxau', 'usd-coin'])

  const SNXPrice = prices.havven.usd
  const SXAUPrice = prices.sxau.usd
  const USDCPrice = prices['usd-coin'].usd

  const Univ2SXAUUSDCTokenPrice = toFixed(
    SXAUPerToken * SXAUPrice + USDCPerToken * USDCPrice,
    2
  )
  const SNXWeeklyROI =
    (rewardPerToken * SNXPrice * 100) / Univ2SXAUUSDCTokenPrice
  return {
    apr: toFixed(SNXWeeklyROI * 52, 4),
  }
}
