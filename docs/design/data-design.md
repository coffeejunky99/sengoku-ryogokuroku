**戦国領国録**

**データ設計書 v0.1**

| **項目** | **内容**                                     |
|----------|----------------------------------------------|
| 文書種別 | データ設計仕様書                             |
| 対象     | 縦切り試作（10城・30武将・4勢力）            |
| 基準仕様 | 戦国領国録 GDD v0.1                          |
| 対象技術 | TypeScript / JSON / CSV / IndexedDB / SQLite |
| 作成日   | 2026年7月13日                                |

**本書はGDDを変更する文書ではない。GDDに存在しないゲーム仕様は追加しない。**

# 目次

1\. 文書目的と適用範囲

2\. データ設計原則

3\. データ分類

4\. 識別子と命名規則

5\. 共通型と値オブジェクト

6\. シナリオデータ

7\. 大名家データ

8\. 武将データ

9\. 城データ

10\. 街道データ

11\. 地形データ

12\. 兵科データ

13\. 施設データ

14\. 外交データ

15\. 軍団・部隊データ

16\. 内政命令データ

17\. AIデータ

18\. 歴史イベントデータ

19\. ゲーム状態データ

20\. セーブデータ

21\. 設定データ

22\. バリデーション

23\. データ配置

24\. 読み込みフロー

25\. バージョニングと移行

26\. テストデータ

27\. セキュリティ・整合性

28\. 縦切り試作のデータ量

29\. 未確定事項

30\. 完了条件

# 1. 文書目的と適用範囲

本書は『戦国領国録』縦切り試作で使用するマスターデータ、ランタイムデータ、セーブデータの構造を定義する。Codexおよび開発者は、本書の型・制約・参照関係を基準として実装する。

- 対象範囲はGDD v0.1で定義された10城、30武将、4勢力、3兵科、6施設、3歴史イベントである。

- マスターデータはJSONまたはCSVで管理し、TypeScriptコードへ直接埋め込まない。

- ランタイムデータとマスターデータを分離し、セーブデータには変更可能状態のみを保存する。

- 正式版の全国規模へ拡張できるID参照方式を採用する。

# 2. データ設計原則

| **原則**     | **内容**                                                                   |
|--------------|----------------------------------------------------------------------------|
| データ駆動   | 武将、城、大名家、施設、兵科、イベント、AI性格は外部データとして管理する。 |
| 正規化       | 同一情報を複数箇所へ重複保存せず、IDで参照する。                           |
| 不変マスター | ゲーム開始後に変更しない定義値はreadonlyとして扱う。                       |
| 状態分離     | 初期値とプレイ中の現在値を別型へ分ける。                                   |
| 決定性       | 乱数状態を保存し、同一セーブの再開時に状態を再現可能にする。               |
| 後方互換     | セーブデータにはschemaVersionを持たせ、移行処理を用意する。                |
| 説明可能性   | AI判断は入力値、重み、採用理由を記録可能な構造にする。                     |
| strict型     | anyを使用せず、列挙値とブランド型で誤参照を防止する。                      |

# 3. データ分類

| **分類**           | **例**                       | **変更頻度**   | **保存先**           |
|--------------------|------------------------------|----------------|----------------------|
| マスターデータ     | 武将定義、城定義、兵科定義   | 低             | JSON / CSV           |
| シナリオ初期データ | 1561年の所属、兵力、外交関係 | シナリオ単位   | JSON                 |
| ランタイム状態     | 現在資金、武将位置、命令進捗 | 高             | Zustand / ゲーム状態 |
| セーブデータ       | ランタイム状態の永続化       | 保存時         | IndexedDB / SQLite   |
| 設定データ         | 音量、自動停止、表示設定     | ユーザー操作時 | IndexedDB / SQLite   |
| 派生データ         | 総兵力、月間収支、脅威度     | 都度計算       | 原則保存しない       |

# 4. 識別子と命名規則

IDは意味のある接頭辞を持つ文字列とし、表示名を識別子として使用しない。

| **対象** | **形式**                      | **例**                      |
|----------|-------------------------------|-----------------------------|
| 大名家   | clan\_\<slug\>                | clan_takeda                 |
| 武将     | general\_\<slug\>             | general_takeda_shingen      |
| 城       | castle\_\<slug\>              | castle_kofu                 |
| 街道     | route\_\<from\>\_\<to\>       | route_kofu_matsushiro       |
| 兵科     | troop\_\<slug\>               | troop_cavalry               |
| 施設     | facility\_\<slug\>            | facility_market             |
| イベント | event\_\<scenario\>\_\<slug\> | event_kawanakajima_standoff |
| シナリオ | scenario\_\<year\>\_\<slug\>  | scenario_1561_kawanakajima  |

- JSONキーはcamelCaseを使用する。

- ファイル名はkebab-caseを使用する。

- 列挙値はlower_snake_caseを使用する。

- IDは公開後に変更しない。名称変更時もIDは維持する。

- IDはTypeScriptのブランド型で相互代入を防止する。

> type Brand\<T, TBrand extends string\> = T & { readonly \_\_brand: TBrand };  
>   
> type ClanId = Brand\<string, "ClanId"\>;  
> type GeneralId = Brand\<string, "GeneralId"\>;  
> type CastleId = Brand\<string, "CastleId"\>;

# 5. 共通型と値オブジェクト

| **型**         | **範囲・形式** | **用途**                     |
|----------------|----------------|------------------------------|
| Stat0To100     | 0～100の整数   | 政治、統率、武勇、知略、忠誠 |
| Ratio0To1      | 0.0～1.0       | 成功率、補正率               |
| NonNegativeInt | 0以上の整数    | 資金、人口、兵士数           |
| GameDate       | year/month/day | ゲーム内年月日               |
| MapPosition    | x/y            | マップ座標                   |
| DurationHours  | 正の数         | 命令・移動所要時間           |
| VersionString  | semver         | スキーマバージョン           |

> interface GameDate {  
> readonly year: number;  
> readonly month: number;  
> readonly day: number;  
> }  
>   
> interface MapPosition {  
> readonly x: number;  
> readonly y: number;  
> }

# 6. シナリオデータ

| **項目**             | **型**     | **必須** | **説明**         |
|----------------------|------------|----------|------------------|
| id                   | ScenarioId | 必須     | シナリオ識別子   |
| name                 | string     | 必須     | 表示名           |
| description          | string     | 必須     | 概要             |
| startDate            | GameDate   | 必須     | 開始年月日       |
| playableClanIds      | ClanId\[\] | 必須     | プレイ可能勢力   |
| initialStateFile     | string     | 必須     | 初期状態ファイル |
| victoryConditionIds  | string\[\] | 必須     | 勝利条件         |
| defeatConditionIds   | string\[\] | 必須     | 敗北条件         |
| estimatedPlayMinutes | number     | 必須     | 想定時間         |

> interface ScenarioDefinition {  
> readonly id: ScenarioId;  
> readonly name: string;  
> readonly description: string;  
> readonly startDate: GameDate;  
> readonly playableClanIds: readonly ClanId\[\];  
> readonly initialStateFile: string;  
> readonly victoryConditionIds: readonly string\[\];  
> readonly defeatConditionIds: readonly string\[\];  
> readonly estimatedPlayMinutes: number;  
> }

# 7. 大名家データ

| **項目**        | **型**          | **制約**  | **説明**     |
|-----------------|-----------------|-----------|--------------|
| id              | ClanId          | 一意      | 大名家ID     |
| name            | string          | 1～40文字 | 表示名       |
| daimyoGeneralId | GeneralId       | 存在必須  | 開始時大名   |
| capitalCastleId | CastleId        | 存在必須  | 本拠地       |
| crestAssetKey   | string          | 空不可    | 家紋素材キー |
| primaryColor    | string          | \#RRGGBB  | 勢力色       |
| aiPersonalityId | AiPersonalityId | 存在必須  | 大名AI性格   |
| initialTreasury | number          | 0以上     | 開始資金     |
| initialFame     | number          | 0～100    | 開始名声     |

> interface ClanDefinition {  
> readonly id: ClanId;  
> readonly name: string;  
> readonly daimyoGeneralId: GeneralId;  
> readonly capitalCastleId: CastleId;  
> readonly crestAssetKey: string;  
> readonly primaryColor: HexColor;  
> readonly aiPersonalityId: AiPersonalityId;  
> }  
>   
> interface ClanState {  
> readonly clanId: ClanId;  
> treasury: number;  
> fame: Stat0To100;  
> threat: Stat0To100;  
> isEliminated: boolean;  
> }

派生値として、支配城数、総兵力、家臣数、月間収支を都度計算する。これらはセーブデータへ重複保存しない。

# 8. 武将データ

| **項目**             | **型**               | **制約** | **説明** |
|----------------------|----------------------|----------|----------|
| id                   | GeneralId            | 一意     | 武将ID   |
| familyName           | string               | 必須     | 姓       |
| givenName            | string               | 必須     | 名       |
| reading              | string               | 必須     | 読み     |
| birthYear            | number               | 整数     | 生年     |
| deathYear            | number\|null         | 生年以上 | 没年     |
| politics             | Stat0To100           | 整数     | 政治     |
| leadership           | Stat0To100           | 整数     | 統率     |
| valor                | Stat0To100           | 整数     | 武勇     |
| intelligence         | Stat0To100           | 整数     | 知略     |
| preferredTroopTypeId | TroopTypeId          | 存在必須 | 得意兵科 |
| traitIds             | TraitId\[\]          | 重複不可 | 特性     |
| personalityId        | GeneralPersonalityId | 存在必須 | 性格     |
| portraitAssetKey     | string               | 空不可   | 肖像素材 |

> type GeneralStatus =  
> \| "idle"  
> \| "domestic_task"  
> \| "moving"  
> \| "diplomacy"  
> \| "assigned_to_army"  
> \| "in_battle"  
> \| "captured"  
> \| "injured"  
> \| "dead";  
>   
> interface GeneralState {  
> readonly generalId: GeneralId;  
> clanId: ClanId \| null;  
> currentCastleId: CastleId \| null;  
> loyalty: Stat0To100;  
> salary: number;  
> status: GeneralStatus;  
> armyId: ArmyId \| null;  
> taskId: TaskId \| null;  
> injuryUntil: GameDate \| null;  
> }

- 死亡状態の武将は命令対象・軍団編成対象から除外する。

- 現在位置は城IDまたは移動経路で表現し、両方を同時に保持しない。

- 所属なしは在野としてclanId=nullで表現する。

- 血縁はRelationshipDefinitionとして別ファイル管理し、双方向整合性を検証する。

# 9. 城データ

| **項目**            | **型**            | **制約** | **説明**       |
|---------------------|-------------------|----------|----------------|
| id                  | CastleId          | 一意     | 城ID           |
| name                | string            | 必須     | 城名           |
| position            | MapPosition       | 必須     | 全国マップ座標 |
| region              | string            | 必須     | 地域名         |
| basePopulation      | number            | 0以上    | 初期基準人口   |
| agricultureCapacity | number            | 0以上    | 農業上限       |
| commerceCapacity    | number            | 0以上    | 商業上限       |
| defenseCapacity     | number            | 0以上    | 城防御上限     |
| facilitySlots       | number            | 0以上    | 施設枠         |
| terrainTags         | TerrainTypeId\[\] | 重複不可 | 城周辺地形     |

> interface CastleState {  
> readonly castleId: CastleId;  
> ownerClanId: ClanId;  
> governorGeneralId: GeneralId \| null;  
> population: number;  
> agriculture: number;  
> commerce: number;  
> publicLoyalty: Stat0To100;  
> security: Stat0To100;  
> defense: number;  
> troopCount: number;  
> training: Stat0To100;  
> devastation: Stat0To100;  
> facilityIds: FacilityId\[\];  
> activeTaskIds: TaskId\[\];  
> }

- 農業・商業・城防御は各城のcapacityを超えない。

- 施設数はfacilitySlotsを超えない。

- 城主は当該城に所在する同一勢力武将のみ設定可能とする。

- 人口、兵士数、資金などの数量は負数を許可しない。

# 10. 街道データ

| **項目**               | **型**        | **説明**   |
|------------------------|---------------|------------|
| id                     | RouteId       | 街道ID     |
| fromCastleId           | CastleId      | 始点       |
| toCastleId             | CastleId      | 終点       |
| distance               | number        | 基準距離   |
| terrainTypeId          | TerrainTypeId | 主要地形   |
| movementCostMultiplier | number        | 移動補正   |
| isBidirectional        | boolean       | 双方向可否 |

縦切り試作では街道グラフを連結グラフとし、孤立城を許可しない。経路探索は最短時間を基準にする。

# 11. 地形データ

| **ID**              | **名称** | **主な効果**               |
|---------------------|----------|----------------------------|
| terrain_plain       | 平地     | 騎馬の移動・突撃に有利     |
| terrain_forest      | 森林     | 騎馬性能低下、鉄砲射程低下 |
| terrain_mountain    | 山岳     | 移動低下、防御側有利       |
| terrain_river       | 河川     | 渡河中の防御低下           |
| terrain_narrow      | 狭路     | 大部隊展開を制限           |
| terrain_castle_gate | 城門     | 防御側に高補正             |

> interface TerrainDefinition {  
> readonly id: TerrainTypeId;  
> readonly name: string;  
> readonly movementMultiplier: number;  
> readonly defenseMultiplier: number;  
> readonly cavalryChargeMultiplier: number;  
> readonly firearmRangeMultiplier: number;  
> }

# 12. 兵科データ

| **項目**         | **型**      | **説明**            |
|------------------|-------------|---------------------|
| id               | TroopTypeId | 兵科ID              |
| name             | string      | 表示名              |
| baseMovement     | number      | 基礎移動速度        |
| baseAttack       | number      | 基礎攻撃            |
| baseDefense      | number      | 基礎防御            |
| baseRange        | number      | 攻撃射程            |
| chargePower      | number      | 突撃威力            |
| upkeepPerSoldier | number      | 兵士1人あたり維持費 |
| terrainModifiers | Record      | 地形補正            |

| **兵科** | **役割**               | **弱点**         |
|----------|------------------------|------------------|
| 足軽     | 防御・戦線維持         | 機動力と射程     |
| 騎馬     | 平地での高速移動・突撃 | 森林・山岳・狭路 |
| 鉄砲     | 遠距離攻撃             | 接近戦・森林     |

# 13. 施設データ

| **施設** | **効果**               | **適用先** |
|----------|------------------------|------------|
| 市場     | 商業収入増加           | 城         |
| 田畑     | 農業収入・人口回復増加 | 城         |
| 道場     | 訓練効率増加           | 城         |
| 奉行所   | 治安・内政効率増加     | 城         |
| 寺院     | 民忠回復・一部外交補正 | 城         |
| 馬場     | 騎馬補充効率増加       | 城         |

> interface FacilityDefinition {  
> readonly id: FacilityId;  
> readonly name: string;  
> readonly buildCost: number;  
> readonly buildDurationHours: number;  
> readonly effects: readonly EffectDefinition\[\];  
> readonly maxLevel: number;  
> }

# 14. 外交データ

> type DiplomaticStatus =  
> \| "friendly"  
> \| "neutral"  
> \| "wary"  
> \| "hostile"  
> \| "allied"  
> \| "truce"  
> \| "vassal"  
> \| "at_war";  
>   
> interface DiplomaticRelationState {  
> readonly pairKey: string;  
> readonly clanAId: ClanId;  
> readonly clanBId: ClanId;  
> status: DiplomaticStatus;  
> affinity: number;  
> treatyExpiresAt: GameDate \| null;  
> overlordClanId: ClanId \| null;  
> brokenPromiseCount: number;  
> lastChangedAt: GameDate;  
> }

- 勢力ペアは順序を正規化したpairKeyで一意に管理する。

- 同盟・停戦には期限を設定可能とする。

- 臣従時はoverlordClanIdを必須とする。

- 交戦中と同盟を同時に保持しない。

# 15. 軍団・部隊データ

> interface ArmyState {  
> readonly id: ArmyId;  
> ownerClanId: ClanId;  
> commanderGeneralId: GeneralId;  
> unitIds: UnitId\[\];  
> currentCastleId: CastleId \| null;  
> movement: ArmyMovementState \| null;  
> morale: Stat0To100;  
> supplyFunds: number;  
> status: "idle" \| "moving" \| "sieging" \| "in_battle" \| "retreating";  
> }  
>   
> interface UnitState {  
> readonly id: UnitId;  
> generalId: GeneralId;  
> troopTypeId: TroopTypeId;  
> soldierCount: number;  
> fatigue: Stat0To100;  
> morale: Stat0To100;  
> }

- 1軍団の武将数は最大5名。

- 総大将はunitIds内の武将でなければならない。

- 武将は同時に複数軍団へ所属できない。

- 軍団資金が0未満にならないよう毎更新でクランプする。

# 16. 内政命令データ

> type DomesticTaskType =  
> \| "develop_agriculture"  
> \| "promote_commerce"  
> \| "relief"  
> \| "maintain_security"  
> \| "fortify_castle"  
> \| "military_training"  
> \| "recruit_soldiers"  
> \| "build_facility";  
>   
> interface DomesticTaskState {  
> readonly id: TaskId;  
> readonly type: DomesticTaskType;  
> readonly castleId: CastleId;  
> readonly assignedGeneralId: GeneralId;  
> readonly startedAt: GameDate;  
> readonly completesAt: GameDate;  
> readonly cost: number;  
> status: "queued" \| "active" \| "completed" \| "cancelled";  
> }

効果量計算式はゲームロジックへ実装し、マスターデータには基礎値と補正係数のみ保持する。計算式をJSONへ文字列として保存しない。

# 17. AIデータ

| **性格**   | **傾向**                       |
|------------|--------------------------------|
| aggressive | 軍事行動と威圧を高く評価       |
| cautious   | 防衛・停戦・戦力温存を高く評価 |
| diplomatic | 親善・同盟・共同出兵を高く評価 |
| domestic   | 内政投資と安定を高く評価       |
| ambitious  | 領土価値と脅威排除を高く評価   |

> interface AiPersonalityDefinition {  
> readonly id: AiPersonalityId;  
> readonly name: string;  
> readonly weights: {  
> readonly aggression: number;  
> readonly caution: number;  
> readonly diplomacy: number;  
> readonly economy: number;  
> readonly ambition: number;  
> };  
> }  
>   
> interface AiDecisionLog {  
> readonly decidedAt: GameDate;  
> readonly clanId: ClanId;  
> readonly actionType: string;  
> readonly candidateScores: readonly AiCandidateScore\[\];  
> readonly selectedReasonCodes: readonly string\[\];  
> }

- AI判断は候補行動を列挙し、各候補へスコアを付与して最大値を選択する。

- 乱数は同点解消または小幅な揺らぎに限定する。

- 重要判断はreasonCodesをUI表示用文章へ変換できるようにする。

# 18. 歴史イベントデータ

> interface HistoricalEventDefinition {  
> readonly id: EventId;  
> readonly name: string;  
> readonly trigger: EventTriggerDefinition;  
> readonly choices: readonly EventChoiceDefinition\[\];  
> readonly oncePerGame: boolean;  
> }  
>   
> interface EventChoiceDefinition {  
> readonly id: string;  
> readonly label: string;  
> readonly effects: readonly EffectDefinition\[\];  
> readonly nextEventId: EventId \| null;  
> }

| **イベント**       | **必須条件例**         | **主な結果**           |
|--------------------|------------------------|------------------------|
| 川中島対陣         | 年月・武将生存・城支配 | 兵力・外交・次イベント |
| 国人衆の離反       | 民忠・脅威度・所属     | 武将所属・城支配       |
| 北条家との外交交渉 | 外交状態・勢力規模     | 友好度・同盟・資金     |

条件と効果は列挙可能な構造化データで表現し、任意コード実行やevalは使用しない。

# 19. ゲーム状態データ

> interface GameState {  
> readonly schemaVersion: string;  
> scenarioId: ScenarioId;  
> currentDate: GameDate;  
> timeScale: 0 \| 1 \| 2 \| 4;  
> playerClanId: ClanId;  
> rngState: RngState;  
> clans: Record\<ClanId, ClanState\>;  
> generals: Record\<GeneralId, GeneralState\>;  
> castles: Record\<CastleId, CastleState\>;  
> armies: Record\<ArmyId, ArmyState\>;  
> diplomacy: Record\<string, DiplomaticRelationState\>;  
> tasks: Record\<TaskId, DomesticTaskState\>;  
> eventHistory: EventHistoryEntry\[\];  
> }

- RecordはIDで直接参照できる正規化状態として保持する。

- React表示用の配列はselectorで生成する。

- Phaserへ渡す描画用データはBridge層で読み取り専用DTOへ変換する。

- 派生値をstoreへ過剰保存しない。

# 20. セーブデータ

| **項目**      | **内容**                                     |
|---------------|----------------------------------------------|
| schemaVersion | セーブスキーマのSemVer                       |
| gameVersion   | アプリのバージョン                           |
| saveId        | セーブ枠ID                                   |
| saveType      | manual / autosave / pre_battle / month_start |
| createdAt     | 実時間の作成日時                             |
| updatedAt     | 実時間の更新日時                             |
| checksum      | 破損検出用                                   |
| payload       | GameState                                    |

> interface SaveEnvelope {  
> readonly schemaVersion: string;  
> readonly gameVersion: string;  
> readonly saveId: string;  
> readonly saveType: "manual" \| "autosave" \| "pre_battle" \| "month_start";  
> readonly createdAt: string;  
> readonly updatedAt: string;  
> readonly checksum: string;  
> readonly payload: GameState;  
> }

- 手動3枠、自動1枠を縦切り試作の上限とする。

- 保存前にスキーマ検証と整合性検証を実行する。

- 書き込みは一時領域へ保存後、成功時に正式データと置換する。

- 読み込み失敗時は直前の有効なバックアップへ復旧する。

- セーブ処理はWebで3秒以内を目標とする。

# 21. 設定データ

> interface UserSettings {  
> readonly schemaVersion: string;  
> masterVolume: number;  
> bgmVolume: number;  
> sfxVolume: number;  
> autoPause: {  
> declarationOfWar: boolean;  
> enemyEntry: boolean;  
> battleStart: boolean;  
> siegeStart: boolean;  
> importantDeath: boolean;  
> historicalEvent: boolean;  
> lowTreasury: boolean;  
> };  
> reducedMotion: boolean;  
> textScale: "small" \| "medium" \| "large";  
> }

# 22. バリデーション

| **種別**     | **検証内容**                           |
|--------------|----------------------------------------|
| 構文         | JSONとして読み込める                   |
| スキーマ     | 必須項目・型・範囲が正しい             |
| 一意性       | 全IDがカテゴリ内で一意                 |
| 参照整合性   | 参照先IDが存在                         |
| 関係整合性   | 大名と所属、城主と城所有者が矛盾しない |
| グラフ整合性 | 街道グラフが連結                       |
| ゲーム成立   | プレイ可能勢力、本拠地、勝敗条件が存在 |
| 数量制約     | 兵士、人口、資金が負数でない           |

- 開発時は起動時に全マスターデータを検証する。

- 本番ビルドではビルド時検証を必須とし、起動時検証は軽量化する。

- 検証失敗時はファイル名、JSONパス、期待値、実値を表示する。

- バリデーションエラーを無視してゲームを開始しない。

# 23. データ配置

> src/  
> data/  
> master/  
> clans.json  
> generals.json  
> castles.json  
> routes.json  
> terrain-types.json  
> troop-types.json  
> facilities.json  
> ai-personalities.json  
> historical-events.json  
> scenarios/  
> scenario-1561-kawanakajima.json  
> scenario-1561-kawanakajima-state.json  
> schemas/  
> \*.schema.json  
> domain/  
> types/  
> validation/  
> repositories/  
> persistence/  
> indexeddb/  
> sqlite/  
> migrations/

CSVは大量入力・編集が必要な武将や城の作業用形式として利用できるが、実行時には検証済みJSONへ変換する。CSVを直接ゲームロジックから読まない。

# 24. 読み込みフロー

1.  アプリ起動時にマスターデータを読み込む。

2.  スキーマ検証と参照整合性検証を実行する。

3.  タイトル画面でシナリオ一覧を表示する。

4.  シナリオ選択時に初期状態を読み込む。

5.  新規ゲームでは初期状態をGameStateへ変換する。

6.  ロード時はSaveEnvelopeを読み込み、必要なら移行処理を実行する。

7.  Zustandへ正規化済み状態を設定する。

8.  Phaserへ描画用DTOを通知する。

# 25. バージョニングと移行

| **変更**     | **扱い**                           |
|--------------|------------------------------------|
| 任意項目追加 | マイナー更新。既定値を補完         |
| 必須項目追加 | 移行処理必須                       |
| 項目名変更   | 旧名から新名へ移行                 |
| 型変更       | 変換可能性を確認し移行             |
| ID変更       | 原則禁止。必要時はIDマッピング必須 |
| 削除         | 複数バージョンを経て段階的に実施   |

> interface SaveMigration {  
> readonly fromVersion: string;  
> readonly toVersion: string;  
> migrate(input: unknown): unknown;  
> }

# 26. テストデータ

- 最小シナリオ: 2城・2勢力・4武将で高速テストする。

- 境界値データ: 能力0/100、人口0、資金0、施設枠0を含める。

- 破損データ: 存在しないID参照、重複ID、負数、循環不整合を用意する。

- セーブ移行: 旧バージョンから最新版への変換テストを保持する。

- 決定性: 同一rngStateと入力で同一結果になることを検証する。

# 27. セキュリティ・整合性

- イベントデータやAIデータから任意コードを実行しない。

- 外部入力はunknownとして受け、検証後に型付けする。

- セーブデータの改変は完全には防げないが、checksumで破損・単純改変を検出する。

- 個人情報は保存しない。

- クラウドセーブは縦切り試作の対象外とする。

# 28. 縦切り試作のデータ量

| **データ**       | **件数** |
|------------------|----------|
| シナリオ         | 1        |
| 大名家           | 4        |
| プレイ可能大名家 | 3        |
| 城               | 10       |
| 武将             | 30       |
| 兵科             | 3        |
| 施設             | 6        |
| 地形             | 6        |
| 戦場マップ       | 3        |
| 歴史イベント     | 3        |
| 手動セーブ枠     | 3        |
| 自動セーブ枠     | 1        |

# 29. 未確定事項

以下はGDDに具体値がないため、本書では確定しない。実装前に仕様提案・承認・GDD更新が必要である。

- 各能力値・収入・維持費の具体的計算式

- 城10件、武将30名の正式な一覧と初期値

- 街道接続と実距離

- 各施設の建設費・時間・効果量

- 兵科の具体的な基礎値

- 外交成功率とAI重みの具体値

- 歴史イベントの全文・選択肢・効果量

- 勝利条件で指定する重要城

- 資金不足による敗北判定の継続期間

Codexは上記を独断で本番値として補完してはならない。テスト用仮値を使用する場合はfixtures配下へ限定し、仮値であることを明示する。

# 30. 完了条件

- 全マスターデータに一意なIDが付与される。

- TypeScript strictで型エラーがない。

- マスターデータのスキーマ検証が自動化される。

- 全ID参照の整合性テストが通る。

- セーブデータにschemaVersionとchecksumが存在する。

- 旧セーブの移行テスト基盤が存在する。

- GDDにない仕様をデータ構造として確定していない。

- 縦切り試作の件数上限を満たすデータを追加可能である。

# 付録A. JSONサンプル

能力値はGDD未確定のため、サンプルでは0を使用する。本番値ではない。

> {  
> "id": "general_takeda_shingen",  
> "familyName": "武田",  
> "givenName": "信玄",  
> "reading": "たけだ しんげん",  
> "birthYear": 1521,  
> "deathYear": 1573,  
> "politics": 0,  
> "leadership": 0,  
> "valor": 0,  
> "intelligence": 0,  
> "preferredTroopTypeId": "troop_cavalry",  
> "traitIds": \[\],  
> "personalityId": "general_personality_cautious",  
> "portraitAssetKey": "portrait_takeda_shingen"  
> }

# 付録B. 参照関係

> Scenario  
> ├─ ClanDefinition\[\]  
> │ ├─ daimyoGeneralId -\> GeneralDefinition  
> │ ├─ capitalCastleId -\> CastleDefinition  
> │ └─ aiPersonalityId -\> AiPersonalityDefinition  
> ├─ GeneralState\[\]  
> │ ├─ clanId -\> ClanState  
> │ ├─ currentCastleId -\> CastleState  
> │ └─ armyId -\> ArmyState  
> ├─ CastleState\[\]  
> │ ├─ ownerClanId -\> ClanState  
> │ └─ governorGeneralId -\> GeneralState  
> └─ DiplomaticRelationState\[\]  
> ├─ clanAId -\> ClanState  
> └─ clanBId -\> ClanState

# 付録C. 変更履歴

| **版** | **日付**   | **内容**             |
|--------|------------|----------------------|
| v0.1   | 2026-07-13 | GDD v0.1に基づく初版 |
