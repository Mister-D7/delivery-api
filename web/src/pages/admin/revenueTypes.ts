import type { AdminIconType } from '../../components/adminIcons';

export type Overview = {
  totalRevenue: number; todayRevenue: number; weekRevenue: number; monthRevenue: number;
  cancelledLoss: number; rtoLoss: number; damagedLoss: number; totalCostOfGoods: number;
  grossProfit: number; deliveryRevenue: number; driverCost: number; deliveryProfit: number; employeeCost: number;
  netProfit: number; totalOrders: number; deliveredOrders: number; cancelledOrders: number; successRate: number;
  revenueLossCancelled: number;
};
export type TopProduct = { name: string; quantity: number; revenue: number; cost: number };
export type ProductCost = { id: string; name: string; salePrice: number; costPrice: number; margin: number; marginPercent: number; stockQty: number; imageUrl?: string };
export type CardDef = { id: string; label: string; value: string; color: string; icon: AdminIconType };
