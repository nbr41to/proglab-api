require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');

const express = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: express,
});

/* Express */

// express.router.get('/get-test', (req, res) => {
//   // ここでは Express のリクエストやレスポンスをそのまま扱う
//   res.send('get-test!!');
// });

/* Start Learning */
app.shortcut('start_learning', async ({ ack, client, body }) => {
  await ack();

  try {
    await client.views.open({
      // 適切な trigger_id を受け取ってから 3 秒以内に渡す
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'submit_learning_input',
        title: {
          type: 'plain_text',
          text: 'オンライン自習室を開始します',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'text',
            label: {
              type: 'plain_text',
              text: '意気込みをどうぞ！',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'learning_input',
              multiline: true,
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
});

app.view('submit_learning_input', async ({ ack, body, view, client }) => {
  await ack();

  console.log('view: ', view);

  const text = `${view['state']['values']['text']['learning_input']['value']}
    <@${body.user.id}>
    https://meet.around.co/r/learning-prog-lab
  `;

  try {
    await client.chat.postMessage({
      token: process.env.SLACK_USER_TOKEN,
      channel: '#test_slack_api',
      as_user: true,
      text,
    });
    await client.chat.postMessage({
      channel: '#test_slack_api',
      text: '自習室におけるスレッドです！\nURLの共有などに使ってください！',
    });
  } catch (error) {
    console.error(error);
  }
});

/* Reactions */
const reactionEmojis = [
  'sparkles',
  'confetti_ball',
  'tada',
  'thumbsup',
  'fire',
  'hotdog',
  'blush',
  'rocket',
];

app.message('', async ({ message, client }) => {
  let reactions = [];
  try {
    while (reactions.length < 3) {
      reactions.push(
        reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)]
      );
      reactions = [...new Set(reactions)];
    }
    if (Math.floor(Math.random() * 100) < 5) {
      reactions[Math.floor(Math.random() * 2)] = 'rainbow';
    }

    console.log(reactions);

    Promise.all(
      reactions.map(async (reaction) => {
        await client.reactions.add({
          name: reaction,
          channel: message.channel,
          timestamp: message.ts,
        });
      })
    );
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();
