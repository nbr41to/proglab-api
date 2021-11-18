"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileMonthlySummary = void 0;
/* 1,2,3位に使用する絵文字 */
const prefixEmojis = ['🥇', '🥈', '🥉'];
const compileMonthlySummary = (params) => {
    const { date, usersCounts, reactionsCounts } = params;
    /* 結果発表テキストの初期値 */
    const results = [`🎊${date}の絵文字リアクション結果🥳`, '\n'];
    /* それぞれの順位に対応するcountの値を取得 */
    const usersCountsRank = checkRank(usersCounts);
    const reactionsCountsRank = checkRank(reactionsCounts);
    /* Usersに関する結果を追加 */
    usersCounts.forEach((user) => {
        const rank = usersCountsRank.indexOf(user.count);
        const prefixEmoji = rank === -1 ? '🎉' : prefixEmojis[rank];
        results.push(`${prefixEmoji} <@${user.userId}>さんは${user.count}回のリアクションをしました！\n`);
    });
    results.push('=== === === ===\n');
    /* Reactionsに関する結果を追加 */
    reactionsCounts.forEach((reaction) => {
        const rank = reactionsCountsRank.indexOf(reaction.count);
        const prefixEmoji = rank === -1 ? '🎉' : prefixEmojis[rank];
        results.push(`${prefixEmoji} ${reaction.count}回「${reaction.reaction}」が使用されました！\n`);
    });
    return results.join('\n');
};
exports.compileMonthlySummary = compileMonthlySummary;
/* countをから順位を重複も含めてチェックし,1,2,3位のcountの値を返す */
const checkRank = (params) => {
    const counts = new Set(params.map((user) => user.count));
    return Array.from(counts)
        .sort((a, b) => b - a)
        .slice(0, 3);
};
