'use server';
import { getSession } from './auth';
import { store } from '@/lib/data';

export async function recordUnfulfilledRequest(shopId: string, commodityId: string) {
  try {
    const session = await getSession();
    const cardId = session?.cardId ?? 'card-KL048821'; // demo fallback for unauthenticated dev
    const id = store.addUnfulfilledRequest(cardId, shopId, commodityId);
    const comm = store.getCommodityById(commodityId);
    const members = store.getMembersByCard(cardId);
    return {
      success: true,
      subscription_id: id,
      members_count: members.length,
      commodity: comm?.name,
      card_id: cardId,
    };
  } catch (e) {
    return {
      success: false,
      error: 'Could not subscribe. Please try again.',
    };
  }
}