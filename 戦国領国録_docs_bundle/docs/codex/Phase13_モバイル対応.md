# Phase13 モバイル対応

## 1. 目的

Capacitorを用いてiOS・Androidで縦切り試作を動作させ、タッチ・安全領域・ライフサイクルを最適化する。

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

- Capacitor sync
- iOS build
- Android build
- タッチ操作
- safe area
- 画面回転対応
- バックグラウンド停止
- 復帰
- SQLite実機確認
- 端末性能確認
- モバイルUI調整

---

## 5. 実装対象外

- ストア申請
- 課金
- 広告
- Push通知
- クラウド同期
- 合戦横画面固定の未承認実装

---

## 6. 実装順序

1. Capacitor設定確認
2. iOS/Android sync
3. safe area
4. Pointer Events
5. ライフサイクル
6. SQLite実機確認
7. 画面回転
8. タッチ対象
9. 性能計測
10. 実機E2E/手動テスト

---

## 7. アーキテクチャ方針

- プラットフォーム差はadapterへ隔離
- DomainへCapacitor依存を入れない
- Webとモバイルで同一GameState
- ライフサイクルイベントはApplicationへ通知する

---

## 8. データ・状態管理

- 設定・セーブ形式は共通
- プラットフォーム固有パスをDomainへ持ち込まない
- バックグラウンド時は時間進行を停止
- 復帰時に巨大deltaを処理しない

---

## 9. テスト内容

### Automated
- mobile viewport E2E
- safe area
- touch操作
- orientation変更時状態維持

### Manual iOS
- 起動
- マップ
- 合戦
- 保存・読込
- バックグラウンド復帰

### Manual Android
- 同上
- 戻るボタン
- SQLite確認

---

## 10. 完了条件

- iOS/Androidで起動する
- 主要操作がタッチで成立する
- safe areaで欠けない
- バックグラウンド復帰で暴走しない
- SQLite保存が実機で動く
- 30FPS未満の重大箇所がない
- lint/typecheck/test/build/e2eが成功する

---

## 11. Codexへの禁止事項

- 未承認で横画面固定する
- Domainへ端末APIを入れる
- Web版を壊す
- 実機確認なしで完了報告する
- ストア申請作業を先行する

---

## 12. 完了報告形式

1. 問題の整理
2. 実装方針
3. 実装内容
4. 影響範囲
5. テスト内容
6. 完了条件

満たしていない条件がある場合は未完了として報告する。
