import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SpeedSample } from '../domain/timeline';
import styles from './SpeedChart.module.css';

interface SpeedChartProps {
  samples: SpeedSample[];
}

const secondsFormat = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 3,
});

export function SpeedChart({ samples }: SpeedChartProps) {
  return (
    <figure className={styles.figure} aria-label="Швидкість за секундами">
      <figcaption className={styles.caption}>
        <span>Швидкість за секундами</span>
        <span className={styles.unit}>WPM</span>
      </figcaption>
      {samples.length === 0 ? (
        <p className={styles.empty}>Замало часу для побудови графіка.</p>
      ) : (
        <>
          <div className={styles.plot}>
            <ResponsiveContainer initialDimension={{ width: 280, height: 240 }}>
              <ComposedChart
                data={samples}
                margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
                accessibilityLayer
                aria-label="Графік WPM і raw WPM. Стрілки ліворуч і праворуч переміщують між секундами."
              >
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis
                  dataKey="second"
                  type="number"
                  domain={[0, 'dataMax']}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  tickFormatter={(value: number) =>
                    `${secondsFormat.format(value)} с`
                  }
                  minTickGap={24}
                  height={30}
                />
                <YAxis
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  width={40}
                />
                <Tooltip
                  isAnimationActive={false}
                  cursor={{ stroke: 'var(--line)' }}
                  labelFormatter={(value) =>
                    `${secondsFormat.format(Number(value))} с`
                  }
                  contentStyle={{
                    background: 'var(--paper)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    fontSize: 12,
                  }}
                />
                <Line
                  dataKey="rawWpm"
                  name="Raw WPM"
                  type="linear"
                  stroke="var(--muted)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={samples.length === 1}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                <Line
                  dataKey="wpm"
                  name="WPM"
                  type="linear"
                  stroke="var(--ink)"
                  strokeWidth={2}
                  dot={samples.length === 1}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
                {samples
                  .filter((sample) => sample.errors > 0)
                  .map((sample) => (
                    <ReferenceDot
                      key={sample.second}
                      x={sample.second}
                      y={sample.wpm}
                      ifOverflow="visible"
                      shape={({ cx, cy }) => {
                        if (cx === undefined || cy === undefined) return <g />;
                        return (
                          <path
                            className={styles.errorMark}
                            d={`M${cx - 3},${cy - 3}l6,6m0,-6l-6,6`}
                          />
                        );
                      }}
                    />
                  ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ul className={styles.legend} aria-label="Позначення графіка">
            <li>
              <span className={styles.wpmKey} aria-hidden="true" />
              WPM
            </li>
            <li>
              <span className={styles.rawKey} aria-hidden="true" />
              Raw WPM
            </li>
            <li>
              <span className={styles.errorKey} aria-hidden="true">
                ×
              </span>
              Секунда з помилками
            </li>
          </ul>
        </>
      )}
    </figure>
  );
}
