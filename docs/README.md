# 戦国領国録 ドキュメント運用

## 正本と用途

- GDDのゲーム仕様上の正本: `GDD/GDD.md` と対応するDOCX
- Codex参照用: Markdownファイル
- 人間のレビュー・共有用: DOCXファイル
- リポジトリ全体のCodex規則: ルートの `/AGENTS.md`

## 更新ルール

1. ゲーム仕様変更はGDDを先に更新する。
2. GDD更新後、データ設計書・技術設計書を必要に応じて更新する。
3. Markdown版とDOCX版は同じ版番号・内容を維持する。
4. Codex実装指示書は `codex/` にPhase単位で保存する。
5. 変更はGitで管理し、Markdown差分をレビューする。

## 注意

`docs/agents/AGENTS.md` は配布・保管用の複製です。Codexに確実に適用させるため、実際のリポジトリでは `AGENTS.md` をリポジトリ直下に置いてください。
