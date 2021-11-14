import {
  addReaction,
  checkReactionMonth,
  getMonthlyReactions,
} from './firebase/reactions';
import dotenv from 'dotenv';
dotenv.config();

const fs = require('fs');
import { App, ExpressReceiver } from '@slack/bolt';

const express = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN || '',
  receiver: express,
});

const PORT = parseInt(process.env.PORT || '') || 3000;

/* Express */
express.router.get('/', (req, res) => {
  // ここでは Express のリクエストやレスポンスをそのまま扱う
  res.json({ status: 200, message: 'Welcome progLab API!!' });
});
express.router.get('/test-auth', (req, res) => {
  res.json({ status: 200, message: 'Welcome progLab API!!' });
});

/* Reactionの監視 */
app.event('reaction_added', async ({ event, client }) => {
  try {
    const { reaction, user } = event;
    /* Reactionの保存 */
    await addReaction({ reactionName: reaction, userId: user });

    /* Summaryの投稿 */
    const result = await checkReactionMonth();
    if (!result) {
      const summary = await getMonthlyReactions();
      await client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN || '',
        channel: '#07_achievement',
        text: JSON.stringify(summary, null, 4),
      });
    }
  } catch (error) {
    console.error(error);
  }
});

app
  .start(PORT)
  .then(() => console.log(`⚡️running by http://localhost:${PORT}`));
