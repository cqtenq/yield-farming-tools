import { ethers } from 'ethers'
import {
  BALANCER_POOL_ABI,
  ERC20_ABI,
  MUSD_TOKEN_ADDR,
  MUSD_USDC_BPT_TOKEN_ADDR,
  USDC_ADDRESS,
  MUSD_USDC_BPT_TOKEN_STAKING_ADDR,
  MSTABLE_REWARDS_POOL_ABI,
} from '../../../constants'
import {
  lookUpPrices,
  toDollar,
  toFixed,
  get_synth_weekly_rewards,
} from '../../../utils'

export default async function main(App) {
  const MUSD_USDC_BALANCER_POOL = new ethers.Contract(
    MUSD_USDC_BPT_TOKEN_ADDR,
    BALANCER_POOL_ABI,
    App.provider
  )
  const MUSD_USDC_BPT_TOKEN_CONTRACT = new ethers.Contract(
    MUSD_USDC_BPT_TOKEN_ADDR,
    ERC20_ABI,
    App.provider
  )
  const BPT_STAKING_POOL = new ethers.Contract(
    MUSD_USDC_BPT_TOKEN_STAKING_ADDR,
    MSTABLE_REWARDS_POOL_ABI,
    App.provider
  )
  const totalStakedBPTAmount =
    (await MUSD_USDC_BPT_TOKEN_CONTRACT.balanceOf(
      MUSD_USDC_BPT_TOKEN_STAKING_ADDR
    )) / 1e18

  const totalBPTAmount = (await MUSD_USDC_BALANCER_POOL.totalSupply()) / 1e18
  const yourBPTAmount =
    (await BPT_STAKING_POOL.balanceOf(App.YOUR_ADDRESS)) / 1e18

  const totalUSDCAmount =
    (await MUSD_USDC_BALANCER_POOL.getBalance(USDC_ADDRESS)) / 1e6
  const totalMUSDAmount =
    (await MUSD_USDC_BALANCER_POOL.getBalance(MUSD_TOKEN_ADDR)) / 1e18

  const USDCPerBPT = totalUSDCAmount / totalBPTAmount
  const MUSDPerBPT = totalMUSDAmount / totalBPTAmount

  // Find out reward rate
  const weekly_reward = await get_synth_weekly_rewards(BPT_STAKING_POOL)
  const MTARewardPerBPT = weekly_reward / totalStakedBPTAmount

  // Look up prices
  const prices = await lookUpPrices(['musd', 'meta', 'usd-coin'])
  const MTAPrice = prices['meta'].usd
  const MUSDPrice = prices['musd'].usd
  const USDCPrice = prices['usd-coin'].usd

  const BPTPrice = USDCPerBPT * USDCPrice + MUSDPerBPT * MUSDPrice

  // Finished. Start printing

  const weeklyRoi = (MTARewardPerBPT * MTAPrice * 100) / BPTPrice

  return {
    provider: 'mStable',
    name: 'Balancer mUSD-USDC',
    poolRewards: ['MTA', 'BAL'],
    apr: toFixed(weeklyRoi * 52, 4),
    prices: [
      { label: 'MTA', value: toDollar(MTAPrice) },
      { label: 'mUSD', value: toDollar(MUSDPrice) },
    ],
    staking: [
      {
        label: 'Pool Total',
        value: toDollar(totalBPTAmount * BPTPrice),
      },
      {
        label: 'Your Total',
        value: toDollar(yourBPTAmount * BPTPrice),
      },
    ],
    rewards: [],
    ROIs: [
      {
        label: 'Hourly',
        value: `${toFixed(weeklyRoi / 7 / 24, 4)}%`,
      },
      {
        label: 'Daily',
        value: `${toFixed(weeklyRoi / 7, 4)}%`,
      },
      {
        label: 'Weekly',
        value: `${toFixed(weeklyRoi, 4)}%`,
      },
    ],
    links: [
      {
        title: 'Info',
        link:
          'https://medium.com/mstable/introducing-mstable-earn-6ac5f4e7560e',
      },
      {
        title: 'Balancer Pool',
        link:
          'https://pools.balancer.exchange/#/pool/0x72Cd8f4504941Bf8c5a21d1Fd83A96499FD71d2C',
      },
      {
        title: 'Stake',
        link: 'https://app.mstable.org/earn',
      },
    ],
  }
}
