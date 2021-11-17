import { db } from './config';
import { WebClient } from '@slack/web-api';

/* Reactionを保存する */
export const addReaction = async (params: {
  reactionName: string;
  userId: string;
}) => {
  const { reactionName, userId } = params;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  await db.collection('slack_reactions').add({
    reactionName,
    userId,
    atDate: `${currentYear}-${currentMonth}`,
  });

  /* 最終更新履歴を更新 */
  await db
    .collection('slack')
    .doc('last_reaction_at_month')
    .set({
      data: `${currentYear}-${currentMonth}`,
    });
};

/* 前回のReactionから月の変更を確認する */
export const checkReactionMonth = async (): Promise<boolean> => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  /* 現在の最終更新月を取得 */
  const lastReactionAtRef = await db
    .collection('slack')
    .doc('last_reaction_at_month')
    .get();
  const lastReactionAt = lastReactionAtRef.data()?.lastReactionAt;

  return lastReactionAt !== `${currentYear}-${currentMonth}`;
};

/**
 * 月のリアクション情報を取得する
 * @params `${currentYear}-${currentMonth}`の形式で
 */
export const getMonthlyReactions = async (param: {
  month?: number;
  client: WebClient;
}) => {
  try {
    const { month, client } = param;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const targetMonth = month || `${currentYear}-${currentMonth}`;

    /* データの取得 */
    const snapshot = await db
      .collection('slack_reactions')
      .where('atDate', '==', targetMonth)
      .get();
    const monthlyReactions = snapshot.docs.map(
      (doc) =>
        doc.data() as { userId: string; reactionName: string; atDate: string },
    );
    const totalReactions = monthlyReactions.map(
      (reaction) => reaction.reactionName,
    );
    const totalUserIds = monthlyReactions.map((reaction) => reaction.userId);
    const totalUsers = await Promise.all(
      totalUserIds.map(async (id) => {
        const response = await client.users.info({ user: id });
        return response?.user?.name || 'no_data';
      }),
    );
    const reactions = Array.from(new Set(totalReactions));
    const users = Array.from(new Set(totalUsers));

    return {
      usersCounts: users
        .map((user) => {
          const count = totalUsers.filter((userId) => userId === user).length;
          return {
            name: user,
            count,
          };
        })
        .sort((a, b) => b.count - a.count),
      reactionsCounts: reactions
        .map((reaction) => {
          const count = totalReactions.filter(
            (reactionName) => reactionName === reaction,
          ).length;
          return {
            reaction,
            count,
          };
        })
        .sort((a, b) => b.count - a.count),
    };
  } catch (error) {
    throw error;
  }
};
