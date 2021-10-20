require('dotenv').config();
const fs = require('fs');
const { App, ExpressReceiver } = require('@slack/bolt');

const express = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: express,
});

const PORT = process.env.PORT || 3000;

/* Express */

express.router.get('/', (req, res) => {
  // ここでは Express のリクエストやレスポンスをそのまま扱う
  res.send('Welcome progLab API!!');
});

/* Start Learning */
// app.shortcut('start_learning', async ({ ack, client, body }) => {
//   await ack();

//   try {
//     await client.views.open({
//       // 適切な trigger_id を受け取ってから 3 秒以内に渡す
//       trigger_id: body.trigger_id,
//       view: {
//         type: 'modal',
//         callback_id: 'submit_learning_input',
//         title: {
//           type: 'plain_text',
//           text: 'オンライン自習室を開始します',
//         },
//         blocks: [
//           {
//             type: 'input',
//             block_id: 'text',
//             label: {
//               type: 'plain_text',
//               text: '意気込みをどうぞ！',
//             },
//             element: {
//               type: 'plain_text_input',
//               action_id: 'learning_input',
//               multiline: true,
//             },
//           },
//         ],
//         submit: {
//           type: 'plain_text',
//           text: 'Submit',
//         },
//       },
//     });
//   } catch (error) {
//     console.error(error);
//   }
// });

// const path = require('path');
// app.view('submit_learning_input', async ({ ack, body, view, client }) => {
//   await ack();

//   console.log('view: ', view);

//   const text = `${view['state']['values']['text']['learning_input']['value']}
//     <@${body.user.id}>
//     https://meet.around.co/r/learning-prog-lab
//   `;

//   try {
//     await client.chat.postMessage({
//       channel: '#test_slack_api',
//       as_user: true,
//       text,
//       unfurl_links: true,
//     });
//     await client.chat.postMessage({
//       channel: '#test_slack_api',
//       text: '自習室におけるスレッドです！\nURLの共有などに使ってください！',
//       icon_url: path.join(__dirname, '/asset/progL-logo.png'),
//     });
//   } catch (error) {
//     console.error(error);
//   }
// });

/* Reactions */
const reactionEmojis = [
  'sparkles',
  'confetti_ball',
  'heart',
  'tada',
  'thumbsup',
  'fire',
  'hotdog',
  'blush',
  'rocket',
];

app.message(async ({ message, client }) => {
  try {
    if (Math.floor(Math.random() * 100) < 30) {
      let reaction =
        reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
      if (Math.floor(Math.random() * 100) < 5) {
        reaction = 'rainbow';
      }
      await client.reactions.add({
        name: reaction,
        channel: message.channel,
        timestamp: message.ts,
      });
    }
  } catch (error) {
    console.error(error);
  }
});

let loading = false;
app.message('https://meet.around.co/r/', async ({ say }) => {
  if (loading) return;
  loading = true;
  setTimeout(() => {
    loading = false;
    say(`スレッドを作成しました！\nURLの共有などに使ってください！`);
  }, 1000 * 10); // 10秒後
});

/* Reactions Count */
// ユーザーごとの回数, 使用された絵文字の回数
app.event('reaction_added', async ({ event, client }) => {
  console.log('reaction_added!!');
  try {
    const { reaction, user } = event;
    incrementReactionData({ emoji: reaction, userId: user });
    console.log('reaction_added: ', event);
  } catch (error) {
    console.error(error);
  }
});
/* データを保存する関数 */
const incrementReactionData = (params) => {
  const { emoji, userId } = params;
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const jsonFileName = `${year}-${month}.json`;
  const dataFileList = fs.readdirSync('./src/data');
  const path = `./src/data/${jsonFileName}`;
  let data = {
    userCount: [],
    emojiCount: [],
  };
  if (dataFileList.includes(jsonFileName)) {
    const json = fs.readFileSync(path, 'utf8');
    data = JSON.parse(json);
  }
  /* increment user */
  if (data.userCount.map((user) => user.id).includes(userId)) {
    const userIndex = data.userCount.map((user) => user.id).indexOf(userId);
    data.userCount[userIndex].count++;
  } else {
    data.userCount.push({
      id: userId,
      count: 1,
    });
  }

  /* increment emoji */
  if (data.emojiCount.map((emoji) => emoji.name).includes(emoji)) {
    const emojiIndex = data.emojiCount
      .map((emoji) => emoji.name)
      .indexOf(emoji);
    data.emojiCount[emojiIndex].count++;
  } else {
    data.emojiCount.push({
      name: emoji,
      count: 1,
    });
  }

  fs.writeFile(path, JSON.stringify(data), () => {});
};

/* Reactionsの報告 */
app.shortcut('report_reactions', async ({ ack, client, say }) => {
  await ack();
  try {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const jsonFileName = `${year}-${month}.json`;
    const dataFileList = fs.readdirSync('./src/data');
    const path = `./src/data/${jsonFileName}`;

    if (dataFileList.includes(jsonFileName)) {
      const json = fs.readFileSync(path, 'utf8');
      data = JSON.parse(json);
      say(JSON.stringify(data, null, 4));
    } else {
      say('現在データはありません');
    }
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  await app.start(PORT);
  console.log(`⚡️ Bolt app is running by ${PORT}`);
})();
