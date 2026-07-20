import type { TimeScale } from '../../../domain/time/time-scale';
import { useGameStore } from '../../../state/game-store';
import { formatGameDate } from '../formatters/format-game-date';

interface TimeScaleOption {
  readonly value: TimeScale;
  readonly label: string;
}

const TIME_SCALE_OPTIONS: readonly TimeScaleOption[] = [
  { value: 0, label: '0倍速' },
  { value: 1, label: '1倍速' },
  { value: 2, label: '2倍速' },
  { value: 4, label: '4倍速' },
];

export function GameTimeControls() {
  const currentDate = useGameStore((state) => state.currentDate);
  const timeScale = useGameStore((state) => state.timeScale);
  const setTimeScale = useGameStore((state) => state.setTimeScale);

  return (
    <section
      className="game-time-controls"
      aria-labelledby="game-time-controls-heading"
      data-testid="game-time-controls"
    >
      <div className="game-time-readout">
        <div>
          <h2 className="eyebrow" id="game-time-controls-heading">現在日付</h2>
          <p className="game-time-date">{formatGameDate(currentDate)}</p>
        </div>
        <p className="game-time-scale-status">
          <span className="eyebrow">現在速度</span>
          <span className="game-time-scale-value">{timeScale}倍速</span>
        </p>
      </div>
      <div className="time-scale-buttons" role="group" aria-label="時間速度">
        {TIME_SCALE_OPTIONS.map((option) => (
          <button
            key={option.value}
            className="time-scale-button"
            type="button"
            aria-pressed={timeScale === option.value}
            onClick={() => {
              setTimeScale(option.value);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
