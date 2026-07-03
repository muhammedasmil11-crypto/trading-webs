import { TradeDirection, TradeType, TradeStatus } from '../types';

interface CalculatePositionSizeParams {
  balance: number;
  riskPercent: number;
  entryPrice: number;
  stopLossPrice: number;
}

export function calculatePositionSize({
  balance,
  riskPercent,
  entryPrice,
  stopLossPrice,
}: CalculatePositionSizeParams) {
  const riskAmount = balance * (riskPercent / 100);
  const slDistance = Math.abs(entryPrice - stopLossPrice);
  
  if (slDistance === 0 || entryPrice === 0) {
    return {
      riskAmount,
      positionSize: 0,
      slPercent: 0,
      notionalValue: 0,
    };
  }

  const positionSize = riskAmount / slDistance;
  const slPercent = (slDistance / entryPrice) * 100;
  const notionalValue = positionSize * entryPrice;

  return {
    riskAmount,
    positionSize,
    slPercent,
    notionalValue,
  };
}

interface CalculatePnLParams {
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees: number;
}

export function calculatePnL({
  direction,
  entryPrice,
  exitPrice,
  quantity,
  fees,
}: CalculatePnLParams) {
  if (entryPrice <= 0 || quantity <= 0) {
    return { pnl: 0, pnlPercent: 0, status: 'BREAKEVEN' as TradeStatus };
  }

  let pnl = 0;
  if (direction === 'LONG') {
    pnl = (exitPrice - entryPrice) * quantity;
  } else {
    // SHORT
    pnl = (entryPrice - exitPrice) * quantity;
  }

  // Subtract fees
  pnl -= fees;

  const costBasis = entryPrice * quantity;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  let status: TradeStatus = 'BREAKEVEN';
  if (pnl > 0.01) {
    status = 'WIN';
  } else if (pnl < -0.01) {
    status = 'LOSS';
  }

  return {
    pnl,
    pnlPercent,
    status,
  };
}

export function calculateRewardRatio(
  direction: TradeDirection,
  entryPrice: number,
  stopLoss: number,
  takeProfit: number
): number {
  const riskDistance = Math.abs(entryPrice - stopLoss);
  const rewardDistance = Math.abs(takeProfit - entryPrice);

  if (riskDistance === 0) return 0;
  return rewardDistance / riskDistance;
}
