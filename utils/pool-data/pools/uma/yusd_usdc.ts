import { ethers } from 'ethers'
import {
  BALANCER_POOL_ABI,
  ERC20_ABI,
  USDC_ADDRESS,
  YUSDSEP20_TOKEN_ADDR,
  YUSD_USDC_BPT_TOKEN_ADDR,
} from '../../../constants'
import { lookUpPrices, toDollar, toFixed } from '../../../utils'

export default async function main(App) {
  const YUSD_USDC_BALANCER_POOL = new ethers.Contract(
    YUSD_USDC_BPT_TOKEN_ADDR,
    BALANCER_POOL_ABI,
    App.provider
  )
  const YUSD_USDC_BPT_TOKEN = new ethers.Contract(
    YUSD_USDC_BPT_TOKEN_ADDR,
    ERC20_ABI,
    App.provider
  )

  const totalBPTAmount = (await YUSD_USDC_BALANCER_POOL.totalSupply()) / 1e18
  const yourBPTAmount =
    (await YUSD_USDC_BPT_TOKEN.balanceOf(App.YOUR_ADDRESS)) / 1e18

  const totalYUSDSEP20Amount =
    (await YUSD_USDC_BALANCER_POOL.getBalance(YUSDSEP20_TOKEN_ADDR)) / 1e18
  const totalUSDCAmount =
    (await YUSD_USDC_BALANCER_POOL.getBalance(USDC_ADDRESS)) / 1e6

  const YUSDSEP20PerBPT = totalYUSDSEP20Amount / totalBPTAmount
  const USDCPerBPT = totalUSDCAmount / totalBPTAmount

  // Find out reward rate
  const weekly_reward = 25000 // 25k UMA every week
  const UMARewardPerBPT = weekly_reward / (totalBPTAmount - 100)

  // Look up prices
  const prices = await lookUpPrices(['usd-coin', 'uma'])
  const USDCPrice = prices['usd-coin'].usd
  const UMAPrice = prices['uma'].usd
  const YUSDSEP20Price =
    ((await YUSD_USDC_BALANCER_POOL.getSpotPrice(
      USDC_ADDRESS,
      YUSDSEP20_TOKEN_ADDR
    )) /
      1e6) *
    USDCPrice

  const BPTPrice = YUSDSEP20PerBPT * YUSDSEP20Price + USDCPerBPT * USDCPrice

  const UMAWeeklyROI = (UMARewardPerBPT * UMAPrice * 100) / BPTPrice

  return {
    provider: 'UMA Project',
    name: 'Balancer yUSD-USDC',
    poolRewards: ['UMA', 'BAL'],
    apr: toFixed(UMAWeeklyROI * 52, 4),
    prices: [
      { label: 'UMA', value: toDollar(UMAPrice) },
      { label: 'yUSD-SEP20', value: toDollar(YUSDSEP20Price) },
      { label: 'BPT', value: toDollar(BPTPrice) },
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
    rewards: [
      {
        label: `${toFixed(UMARewardPerBPT * yourBPTAmount, 2)} UMA`,
        value: toDollar(UMARewardPerBPT * yourBPTAmount * UMAPrice),
      },
    ],
    ROIs: [
      {
        label: 'Hourly',
        value: `${toFixed(UMAWeeklyROI / 7 / 24, 4)}%`,
      },
      {
        label: 'Daily',
        value: `${toFixed(UMAWeeklyROI / 7, 4)}%`,
      },
      {
        label: 'Weekly',
        value: `${toFixed(UMAWeeklyROI, 4)}%`,
      },
    ],
    links: [
      {
        title: 'Info',
        link:
          'https://medium.com/uma-project/liquidity-mining-on-uma-is-now-live-5f6cb0bd53ee',
      },
      {
        title: 'Instructions',
        link: 'https://docs.umaproject.org/tutorials/mint-farm-yusd',
      },
      {
        title: 'Balancer Pool',
        link:
          'https://pools.balancer.exchange/#/pool/0x58EF3abAB72c6C365D4D0D8a70039752b9f32Bc9',
      },
    ],
  }
}
