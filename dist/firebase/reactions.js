"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthlyReactionsSummary = exports.checkPostSummaryTrigger = exports.addReaction = void 0;
const config_1 = require("./config");
/* Reactionを保存する */
const addReaction = (params) => __awaiter(void 0, void 0, void 0, function* () {
    const { reactionName, userId } = params;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    yield config_1.db.collection('slack_reactions').add({
        reactionName,
        userId,
        atDate: `${currentYear}-${currentMonth}`,
    });
});
exports.addReaction = addReaction;
/* 月の変更を確認する（サマリーの投稿のトリガーとなる） */
const checkPostSummaryTrigger = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    try {
        /* 現在の最終更新月を取得 */
        const lastReactionAtRef = yield config_1.db
            .collection('slack')
            .doc('last_reaction_at_month')
            .get();
        const lastReactionAt = (_a = lastReactionAtRef.data()) === null || _a === void 0 ? void 0 : _a.date;
        console.log('FireStoreから取得した前回の月 >>', lastReactionAt);
        console.log('今回更新される月 >>', `${currentYear}-${currentMonth}`);
        if (!lastReactionAt)
            return false;
        /* 確認した際に最終更新月を更新 */
        yield config_1.db
            .collection('slack')
            .doc('last_reaction_at_month')
            .set({
            date: `${currentYear}-${currentMonth}`,
        });
        return lastReactionAt !== `${currentYear}-${currentMonth}`;
    }
    catch (error) {
        console.error('Error:checkPostSummaryTrigger:', error);
        return false;
    }
});
exports.checkPostSummaryTrigger = checkPostSummaryTrigger;
/**
 * 月のリアクション情報を取得する
 * @params `${currentYear}-${currentMonth}`の形式で
 */
const getMonthlyReactionsSummary = (month) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let currentYear = new Date().getFullYear();
        let currentMonth = new Date().getMonth(); // 0-11
        if (currentMonth === 0) {
            currentYear -= 1;
            currentMonth = 12;
        }
        const targetMonth = month || `${currentYear}-${currentMonth}`; // 先月のデータ
        /* データの取得 */
        const snapshot = yield config_1.db
            .collection('slack_reactions')
            .where('atDate', '==', targetMonth)
            .get();
        const monthlyReactions = snapshot.docs.map((doc) => doc.data());
        const totalUserIds = monthlyReactions.map((reaction) => reaction.userId);
        const totalReactions = monthlyReactions.map((reaction) => reaction.reactionName);
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
                const count = totalReactions.filter((reactionName) => reactionName === reaction).length;
                return {
                    reaction: `:${reaction}:`,
                    count,
                };
            })
                .sort((a, b) => b.count - a.count),
        };
        return result;
    }
    catch (error) {
        throw error;
    }
});
exports.getMonthlyReactionsSummary = getMonthlyReactionsSummary;
