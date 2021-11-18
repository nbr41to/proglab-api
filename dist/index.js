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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compileMonthlySummary_1 = require("./lib/compileMonthlySummary");
const reactions_1 = require("./firebase/reactions");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bolt_1 = require("@slack/bolt");
const express = new bolt_1.ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});
const app = new bolt_1.App({
    token: process.env.SLACK_BOT_TOKEN || '',
    receiver: express,
});
/* Express */
express.router.get('/', (req, res) => {
    res.json({ status: 200, message: 'Welcome!! progLab API' });
});
/* Reactionの監視 */
app.event('reaction_added', ({ event, client }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reaction, user } = event;
        /* Reactionの保存 */
        yield (0, reactions_1.addReaction)({ reactionName: reaction, userId: user });
        /* Summaryの投稿 */
        /* 月が更新されたかどうかをチェック */
        const checkResult = yield (0, reactions_1.checkPostSummaryTrigger)();
        /* 月が更新された場合に投稿する */
        if (checkResult) {
            const summary = yield (0, reactions_1.getMonthlyReactionsSummary)();
            yield client.chat.postMessage({
                token: process.env.SLACK_BOT_TOKEN || '',
                channel: '#07_achievement',
                text: (0, compileMonthlySummary_1.compileMonthlySummary)(summary),
            });
        }
    }
    catch (error) {
        console.error(error);
    }
}));
const port = parseInt(process.env.PORT || '3000');
app
    .start(port)
    .then(() => console.log(`⚡️running by http://localhost:${port}`));
