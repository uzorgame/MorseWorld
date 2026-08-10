import './translator.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}

/**
 * Повзунок у вигляді шкали з рисок — той самий прийом, що в нижній панелі
 * та на шкалі частот під час запуску.
 */
export function Slider({ label, value, min, max, step, unit, onChange }: Props) {
  const ratio = (value - min) / (max - min)

  return (
    <label className="sld" style={{ '--ratio': ratio } as React.CSSProperties}>
      <span className="sld__top">
        <span className="micro">{label}</span>
        <span className="micro sld__value mono">
          {value}
          {unit}
        </span>
      </span>

      <span className="sld__track">
        <span className="sld__ticks" aria-hidden="true">
          {Array.from({ length: 25 }, (_, i) => (
            <i key={i} data-major={i % 6 === 0 ? '' : undefined} data-lit={i / 24 <= ratio ? '' : undefined} />
          ))}
        </span>
        <span className="sld__fill" aria-hidden="true" />
        <input
          type="range"
          className="sld__input"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
      </span>
    </label>
  )
}
