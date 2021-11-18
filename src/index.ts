import { compileMonthlySummary } from './lib/compileMonthlySummary';
import {
  addReaction,
  checkPostSummaryTrigger,
  getMonthlyReactionsSummary,
} from './firebase/reactions';
import dotenv from 'dotenv';
dotenv.config();

import { App, ExpressReceiver } from '@slack/bolt';

const express = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN || '',
  receiver: express,
});

/* Express */
express.router.get('/', (req, res) => {
  res.json({ status: 200, message: 'Welcome!! progLab API' });
});

/* Reactionの監視 */
app.event('reaction_added', async ({ event, client }) => {
  try {
    const { reaction, user } = event;
    /* Reactionの保存 */
    await addReaction({ reactionName: reaction, userId: user });

    /* Summaryの投稿 */
    /* 月が更新されたかどうかをチェック */
    const checkResult = await checkPostSummaryTrigger();

    /* 月が更新された場合に投稿する */
    if (checkResult) {
      const summary = await getMonthlyReactionsSummary();
      await client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN || '',
        channel: '#07_achievement',
        text: compileMonthlySummary(summary),
      });
    }
  } catch (error) {
    console.error(error);
  }
});

const port = parseInt(process.env.PORT || '3000');
app
  .start(port)
  .then(() => console.log(`⚡️running by http://localhost:${port}`));
