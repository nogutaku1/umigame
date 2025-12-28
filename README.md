# エターナルウミガメのスープ (Eternal Turtle Soup)

AIが無限に生成する水平思考クイズ「ウミガメのスープ」をプレイできるウェブアプリケーションです。

🎮 **[プレイする](https://umigame.vercel.app)**

## 特徴

- **無限のクイズ生成**: OpenAI (GPT-4o) を使用して、毎回新しい不可解な状況と真相を生成
- **インテリジェントな応答**: 「はい」「いいえ」「どちらとも言えません」で適切に回答
- **真相の判定**: プレイヤーの推理が核心を突いているか、AIが柔軟に判定
- **モダンなUI**: ガラスモーフィズムを採用したダークテーマデザイン
- **3段階の難易度**: 初級・中級・上級から選択可能

## 技術スタック

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend**: Vercel Serverless Functions
- **AI**: OpenAI API (GPT-4o)

## デプロイ方法

1. このリポジトリをフォークまたはクローン
2. [Vercel](https://vercel.com)にログイン
3. 「New Project」からこのリポジトリをインポート
4. Environment Variablesに以下を設定:
   - `OPENAI_API_KEY`: あなたのOpenAI APIキー
5. デプロイ！

## ローカル開発

```bash
# Vercel CLIをインストール
npm i -g vercel

# ローカルで実行（.env.localにOPENAI_API_KEYを設定）
vercel dev
```

## ライセンス

MIT License
