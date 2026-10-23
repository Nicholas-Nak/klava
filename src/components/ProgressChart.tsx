import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyProgress } from '../domain/progress';
import styles from './ProgressChart.module.css';

const axisDate = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const fullDate = new Intl.DateTimeFormat('uk-UA', {
  dateStyle: 'long',
  timeZone: 'UTC',
});
const numberFormat = new Intl.NumberFormat('uk-UA', {
  maximumFractionDigits: 1,
});

export function ProgressChart({ days }: { days: DailyProgress[] }) {
  const first = days[0];
  const last = days.at(-1);
  if (!first || !last) return null;
  const domain: [number, number] =
    first === last
      ? [first.timestamp - 86400000, last.timestamp + 86400000]
      : [first.timestamp, last.timestamp];
  return (
    <figure className={styles.figure} aria-label="Прогрес за днями">
      <figcaption>
        Прогрес за днями <span>WPM</span>
      </figcaption>
      <div className={styles.plot}>
        <ResponsiveContainer initialDimension={{ width: 280, height: 220 }}>
          <LineChart
            data={days}
            margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
            accessibilityLayer
            aria-label="Графік середньої та найкращої WPM за днями. Стрілки переміщують між днями."
          >
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={domain}
              tickFormatter={(value: number) => axisDate.format(value)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
              minTickGap={48}
              height={32}
            />
            <YAxis
              domain={[0, 'auto']}
              allowDecimals={false}
              width={36}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--muted)', fontSize: 11 }}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: 'var(--line)' }}
              content={({ active, label }) => {
                const day = active
                  ? days.find((point) => point.timestamp === label)
                  : undefined;
                return day ? (
                  <div
                    className={styles.tooltip}
                    role="status"
                    aria-label="Деталі дня"
                  >
                    <p>{fullDate.format(day.timestamp)}</p>
                    <dl>
                      <div>
                        <dt>Середня WPM</dt>
                        <dd>{numberFormat.format(day.averageWpm)}</dd>
                      </div>
                      <div>
                        <dt>Найкраща WPM</dt>
                        <dd>{day.bestWpm}</dd>
                      </div>
                      <div>
                        <dt>Тестів</dt>
                        <dd>{day.tests}</dd>
                      </div>
                    </dl>
                  </div>
                ) : null;
              }}
            />
            <Line
              dataKey="averageWpm"
              name="Середня WPM"
              stroke="var(--ink)"
              strokeWidth={2}
              dot={{ r: 3, strokeWidth: 1, fill: 'var(--paper)' }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="bestWpm"
              name="Найкраща WPM"
              stroke="var(--accent)"
              strokeDasharray="4 4"
              dot={{ r: 3, strokeWidth: 1, fill: 'var(--paper)' }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className={styles.legend} aria-label="Позначення прогресу">
        <li>
          <i aria-hidden="true" />
          Середня WPM
        </li>
        <li>
          <i aria-hidden="true" />
          Найкраща WPM
        </li>
      </ul>
      <p className={styles.note}>
        Усі тести обраної мови, за місцевими датами. Стрілки ліворуч і праворуч
        — деталі дня.
      </p>
      <details className={styles.data}>
        <summary>Дані прогресу</summary>
        <table>
          <caption>Показники за днями</caption>
          <thead>
            <tr>
              <th scope="col">Дата</th>
              <th scope="col">Середня WPM</th>
              <th scope="col">Найкраща WPM</th>
              <th scope="col">Тестів</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.day}>
                <th scope="row">
                  <time dateTime={day.day}>
                    {axisDate.format(day.timestamp)}
                  </time>
                </th>
                <td>{numberFormat.format(day.averageWpm)}</td>
                <td>{day.bestWpm}</td>
                <td>{day.tests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
