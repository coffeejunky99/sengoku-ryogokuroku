# Phase10 AI

## 1. 目的

内政・外交・軍事・合戦のルールベースAIを実装し、重要判断の理由を説明可能にする。

---

## 2. 参照文書

実装前に以下を読む。

- `AGENTS.md`
- `docs/codex/README.md`
- `docs/GDD/GDD.md`
- `docs/design/data-design.md`
- `docs/design/technical-design.md`
- 直前Phaseの完了報告

GDDに存在しない仕様は実装しない。

---

## 3. 開始条件

- 直前Phaseが完了している
- `npm run lint` が成功する
- `npm run typecheck` が成功する
- `npm run test` が成功する
- `npm run build` が成功する
- 未解決の重大エラーがない
- 対象機能に必要な仕様がGDDに存在する

条件を満たさない場合は開始しない。

---

## 4. 実装対象

- AI観測
- 候補生成
- スコアリング
- 行動選択
- 理由コード
- 判断ログ
- 内政AI
- 外交AI
- 軍事AI
- 合戦AI
- 従属AI
- 更新頻度分散

---

## 5. 実装対象外

- 機械学習
- 外部AI API
- ブラックボックス判断
- 乱数のみの判断
- 未確定の重みを本番値として独断確定

---

## 6. 実装順序

1. AI共通pipeline
2. Candidate型
3. ScoreBreakdown
4. DecisionLog
5. 内政AI
6. 外交AI
7. 軍事AI
8. 合戦AI
9. 従属AI
10. 更新スケジューラ
11. 理由UI
12. テスト

---

## 7. アーキテクチャ方針

- Observe→Candidates→Score→Select→Execute→Log
- 各AIは純粋評価関数を中心にする
- 実行はApplication Use Caseを利用
- AI専用の裏口で状態変更しない
- 同点時のみ制御された乱数を許可する

---

## 8. データ・状態管理

- 性格重みはmaster data
- 候補ごとの内訳を保存
- reasonCodesを表示文へ変換
- RNG状態を保存
- 正式な重み未確定なら仕様不足として停止する

---

## 9. テスト内容

### Unit
- 候補生成
- スコア内訳
- 性格差
- 同一入力の決定性
- 同点処理
- 禁止行動除外

### Integration
- AIから既存Use Case実行
- 判断ログ保存
- UI理由表示
- 複数勢力の更新分散

### E2E
- AI内政
- AI外交
- AI出兵
- AI合戦
- 理由確認

---

## 10. 完了条件

- 各AIがルールベースで動作する
- 重要判断理由を表示できる
- ランダムだけで決めない
- 既存ゲームルールを迂回しない
- 性能計測を行う
- lint/typecheck/test/build/e2eが成功する

---

## 11. Codexへの禁止事項

- AIからStoreを直接書き換える
- 理由ログを省略する
- 外部生成AIを使う
- 重みを根拠なく決める
- 全AIを毎tick一斉評価する

---

## 12. 完了報告形式

1. 問題の整理
2. 実装方針
3. 実装内容
4. 影響範囲
5. テスト内容
6. 完了条件

満たしていない条件がある場合は未完了として報告する。
