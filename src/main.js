const { App } = require('@slack/bolt');
require('dotenv').config();

// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.command(
  '/learning',
  async ({ command, ack, respond, say, client, body }) => {
    // コマンドリクエストを確認
    await ack();

    // await say(`${command.text}`);
    try {
      const result = await client.views.open({
        // 適切な trigger_id を受け取ってから 3 秒以内に渡す
        trigger_id: body.trigger_id,
        // view の値をペイロードに含む
        view: {
          type: 'modal',
          // callback_id が view を特定するための識別子
          callback_id: 'learning_input',
          title: {
            type: 'plain_text',
            text: 'オンライン自習室を開始します',
          },
          blocks: [
            {
              type: 'input',
              block_id: 'input_a',
              label: {
                type: 'plain_text',
                text: '意気込みを入力してください！',
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
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
);

app.view('learning_input', async ({ ack, body, view, client, respond }) => {
  // モーダルでのデータ送信イベントを確認
  await ack();
  // 入力値を使ってやりたいことをここで実装 - ここでは DB に保存して送信内容の確認を送っている
  // block_id: block_1 という input ブロック内で action_id: input_a の場合の入力
  const val = `${view['state']['values']['input_a']['learning_input']['value']}
  
    https://meet.around.co/r/learning-prog-lab
  `;

  // ユーザーにメッセージを送信
  try {
    const { user } = await client.users.info({ user: body.user.id });
    console.log(user);
    await client.chat.postMessage({
      icon_url: user.profile.image_24,
      channel: '#test_slack_api',
      text: val,
      username: user.profile.display_name,
    });
  } catch (error) {
    console.error(error);
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();
