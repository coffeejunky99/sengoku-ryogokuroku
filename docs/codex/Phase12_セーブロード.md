# Phase12 セーブロード

## 1. 目的

WebのIndexedDBとモバイルのSQLiteで共通契約のセーブ・ロード・移行・破損復旧を実装する。

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

- SaveEnvelope
- 手動3枠
- 自動1枠
- IndexedDB
- SQLite
- InMemory repository
- schemaVersion
- checksum
- atomic write
- backup
- migration
- 保存・読込UI
- 自動保存

---

## 5. 実装対象外

- クラウドセーブ
- アカウント同期
- オンラインバックアップ
- 暗号化による完全な改ざん防止

---

## 6. 実装順序

1. SaveRepository
2. SaveEnvelope serializer
3. validation
4. checksum
5. InMemory実装
6. IndexedDB実装
7. SQLite実装
8. atomic write
9. backup recovery
10. migrations
11. UI
12. autosave
13. contract tests

---

## 7. アーキテクチャ方針

- ApplicationはRepository interfaceへ依存
- Web/モバイルで同じSaveEnvelope
- 書込はtemporary→verify→replace
- migrationを連鎖適用
- 永続化失敗で既存セーブを壊さない

---

## 8. データ・状態管理

- schemaVersion必須
- gameVersion必須
- RNG状態を保存
- createdAt/updatedAt
- saveType
- checksum
- 旧ID変更時はmapping必須

---

## 9. テスト内容

### Unit
- serialize/deserialize
- checksum
- validation
- migration
- 破損検出

### Contract
- InMemory
- IndexedDB
- SQLite

### Integration
- 保存→変更→読込
- atomic failure
- backup recovery
- autosave

### E2E
- 3手動枠
- 1自動枠
- 保存
- ロード
- 破損時表示

---

## 10. 完了条件

- 3手動枠・1自動枠が動作する
- Web/モバイルで共通契約
- 旧版移行テストがある
- 失敗時に前回セーブが残る
- 3秒以内目標を計測する
- lint/typecheck/test/build/e2eが成功する

---

## 11. Codexへの禁止事項

- localStorageだけで実装する
- schemaVersionを省略する
- 破損時に上書きする
- クラウドセーブを追加する
- migrationなしで型を変更する

---

## 12. 完了報告形式

1. 問題の整理
2. 実装方針
3. 実装内容
4. 影響範囲
5. テスト内容
6. 完了条件

満たしていない条件がある場合は未完了として報告する。
