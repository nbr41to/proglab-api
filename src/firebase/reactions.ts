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
};

/* 月の変更を確認する（サマリーの投稿のトリガーとなる） */
export const checkPostSummaryTrigger = async (): Promise<boolean> => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  try {
    /* 現在の最終更新月を取得 */
    const lastReactionAtRef = await db
      .collection('slack')
      .doc('last_reaction_at_month')
      .get();
    const lastReactionAt = lastReactionAtRef.data()?.date;
    console.log('FireStoreから取得した前回の月 >>', lastReactionAt);
    console.log('今回更新される月 >>', `${currentYear}-${currentMonth}`);
    if (!lastReactionAt) return false;

    /* 確認した際に最終更新月を更新 */
    await db
      .collection('slack')
      .doc('last_reaction_at_month')
      .set({
        date: `${currentYear}-${currentMonth}`,
      });
    return lastReactionAt !== `${currentYear}-${currentMonth}`;
  } catch (error) {
    console.error('Error:checkPostSummaryTrigger:', error);
    return false;
  }
};

/**
 * 月のリアクション情報を取得する
 * @params `${currentYear}-${currentMonth}`の形式で
 */
export const getMonthlyReactionsSummary = async (month?: string) => {
  try {
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth(); // 0-11
    if (currentMonth === 0) {
      currentYear -= 1;
      currentMonth = 12;
    }
    const targetMonth = month || `${currentYear}-${currentMonth}`; // 先月のデータ

    /* データの取得 */
    const snapshot = await db
      .collection('slack_reactions')
      .where('atDate', '==', targetMonth)
      .get();
    const monthlyReactions = snapshot.docs.map(
      (doc) =>
        doc.data() as { userId: string; reactionName: string; atDate: string },
    );
    const totalUserIds = monthlyReactions.map((reaction) => reaction.userId);
    const totalReactions = monthlyReactions.map(
      (reaction) => reaction.reactionName,
    );

    /* それぞれを重複のない配列に変換 */
    const users = Array.from(new Set(totalUserIds));
    const reactions = Array.from(new Set(totalReactions));

    const result = {
      date: `${currentYear}年${currentMonth}月`,
      usersCounts: users
        .map((user) => {
          const count = totalUserIds.filter((userId) => userId === user).length;
          return {
            userId: user,
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
            reaction: `:${reaction}:`,
            count,
          };
        })
        .sort((a, b) => b.count - a.count),
    };

    return result;
  } catch (error) {
    throw error;
  }
};
