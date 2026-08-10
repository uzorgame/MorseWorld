import { callsFor } from '../components/shell/CallSign'
import { useLang } from '../state/lang'
import { PageHead } from './PageHead'
import './pages.css'

const STRINGS = {
  uk: {
    title: 'Декодер: мікрофон і файл',
    lead: 'Одне джерело чи інше — далі однаковий конвеєр: сигнал → Ґьорцель → поріг → Event[] → ядро. Дані нікуди не передаються.',
    planned: 'ЗАПЛАНОВАНО',
    mic: 'Мікрофон',
    micItems: [
      'getUserMedia → AudioWorklet, вікно 512 семплів (~11 мс при 44.1 кГц)',
      'Автопошук несучої в діапазоні 400–1000 Гц за максимумом енергії',
      'Адаптивний поріг: ковзне середнє шуму, гістерезис 1.5× / 1.2×',
      'Осцилограма, індикатор рівня, поточна частота, оцінена WPM',
      'Явний стан доступу до мікрофона й зрозуміла інструкція при відмові',
    ],
    file: 'Файл',
    fileItems: [
      'WAV, MP3, OGG, M4A до 20 МБ',
      'decodeAudioData → Float32Array → той самий детектор',
      'Обробка у воркері з прогресом',
    ],
  },
  en: {
    title: 'Decoder: microphone and file',
    lead: 'Either source feeds the same pipeline afterwards: signal → Goertzel → threshold → Event[] → core. Nothing is sent anywhere.',
    planned: 'PLANNED',
    mic: 'Microphone',
    micItems: [
      'getUserMedia → AudioWorklet, 512-sample window (~11 ms at 44.1 kHz)',
      'Automatic carrier search in the 400–1000 Hz range by peak energy',
      'Adaptive threshold: rolling noise average, 1.5× / 1.2× hysteresis',
      'Waveform, level meter, current frequency, estimated WPM',
      'Explicit microphone permission state and a clear message on refusal',
    ],
    file: 'File',
    fileItems: [
      'WAV, MP3, OGG, M4A up to 20 MB',
      'decodeAudioData → Float32Array → the same detector',
      'Processed in a worker with progress',
    ],
  },
} as const

export function Decoder() {
  const { lang } = useLang()
  const t = STRINGS[lang]

  return (
    <div className="page shell">
      <PageHead call={callsFor(lang).decoder} title={t.title} lead={t.lead} />

      <div className="stub">
        <span className="micro">{t.planned}</span>
        <div className="stub__body">
          <h2 className="h3">{t.mic}</h2>
          <ul>
            {t.micItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="stub__body">
          <h2 className="h3">{t.file}</h2>
          <ul>
            {t.fileItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
