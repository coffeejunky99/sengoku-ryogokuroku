import type { SelectedCastleViewModel } from '../../../state/selectors/map-selectors';

interface SelectedCastlePanelProps {
  readonly castle: SelectedCastleViewModel | null;
}

export function SelectedCastlePanel({ castle }: SelectedCastlePanelProps) {
  return (
    <section
      className="selected-castle-panel"
      aria-labelledby="selected-castle-heading"
      aria-live="polite"
      data-testid="selected-castle-panel"
    >
      <div className="selected-castle-heading">
        <p className="eyebrow">選択中の城</p>
        <h2 id="selected-castle-heading">
          {castle === null ? '城を選択してください' : castle.name}
        </h2>
      </div>
      {castle === null ? (
        <p className="selected-castle-empty">マップ上の城をタップすると概要を表示します。</p>
      ) : (
        <dl className="selected-castle-details">
          <dt>地域</dt>
          <dd>{castle.region}</dd>
          <dt>勢力</dt>
          <dd>{castle.clanName}</dd>
          <dt>識別</dt>
          <dd>
            <span className="clan-symbol">{castle.identificationSymbol}</span>
          </dd>
        </dl>
      )}
    </section>
  );
}
