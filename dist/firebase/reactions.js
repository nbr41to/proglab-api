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
exports.getMonthlyReactions = exports.checkReactionMonth = exports.addReaction = void 0;
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
    /* 最終更新履歴を更新 */
    yield config_1.db
        .collection('slack')
        .doc('last_reaction_at_month')
        .set({
        data: `${currentYear}-${currentMonth}`,
    });
});
exports.addReaction = addReaction;
/* 前回のReactionから月の変更を確認する */
const checkReactionMonth = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    /* 現在の最終更新月を取得 */
    const lastReactionAtRef = yield config_1.db
        .collection('slack')
        .doc('last_reaction_at_month')
        .get();
    const lastReactionAt = (_a = lastReactionAtRef.data()) === null || _a === void 0 ? void 0 : _a.lastReactionAt;
    return lastReactionAt !== `${currentYear}-${currentMonth}`;
});
exports.checkReactionMonth = checkReactionMonth;
/**
 * 月のリアクション情報を取得する
 * @params `${currentYear}-${currentMonth}`の形式で
 */
const getMonthlyReactions = (param) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { month, client } = param;
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        const targetMonth = month || `${currentYear}-${currentMonth}`;
        /* データの取得 */
        const snapshot = yield config_1.db
            .collection('slack_reactions')
            .where('atDate', '==', targetMonth)
            .get();
        const monthlyReactions = snapshot.docs.map((doc) => doc.data());
        const totalReactions = monthlyReactions.map((reaction) => reaction.reactionName);
        const totalUserIds = monthlyReactions.map((reaction) => reaction.userId);
        const totalUsers = yield Promise.all(totalUserIds.map((id) => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            const response = yield client.users.info({ user: id });
            return ((_b = response === null || response === void 0 ? void 0 : response.user) === null || _b === void 0 ? void 0 : _b.name) || 'no_data';
        })));
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
                const count = totalReactions.filter((reactionName) => reactionName === reaction).length;
                return {
                    reaction,
                    count,
                };
            })
                .sort((a, b) => b.count - a.count),
        };
    }
    catch (error) {
        throw error;
    }
});
exports.getMonthlyReactions = getMonthlyReactions;
