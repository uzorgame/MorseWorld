import { callsFor } from '../components/shell/CallSign'
import { useLang } from '../state/lang'
import { PageHead } from './PageHead'
import { AboutNav } from './aboutNav'
import './pages.css'

const CONTENT = {
  uk: {
    title: 'Приватність',
    lead: 'Ніщо з того, що ви тут робите, не покидає ваш пристрій. Це не обіцянка в політиці конфіденційності, а властивість архітектури: надсилати ці дані просто нікуди, бекенду не існує.',
    s01: '01 — ЧОМУ ЦЕ ВЛАСТИВІСТЬ, А НЕ ОБІЦЯНКА',
    s01title: 'Надсилати нікуди — сервера немає',
    s01p: 'Обіцянку можна зламати непомітно — відсутність сервера ні: перевірити це можна самому, відкривши панель «Network» у браузері й постукавши ключем. Жодного запиту з вашим текстом, звуком чи прогресом ви там не побачите, бо адреси, куди його надіслати, не існує.',
    points: [
      { code: '·−', text: 'Звук із мікрофона обробляється локально й ніде не зберігається' },
      { code: '−···', text: 'Аудіофайли не завантажуються на сервер — вони читаються прямо у вкладці' },
      {
        code: '−·−·',
        text: 'Прогрес навчання лежить у localStorage вашого браузера й нікуди не синхронізується',
      },
      {
        code: '−··',
        text: 'Єдине, що йде назовні, — Google Analytics: які сторінки відкривали, звідки прийшли, з якого пристрою. Без реклами й без профілювання',
      },
    ],
    s02: '02 — ЧОГО НЕМАЄ',
    s02title: 'Ні акаунтів, ні синхронізації',
    s02p: 'Реєстрації немає, бо нічого не потрібно зберігати на чужому боці. Через це між пристроями нічого не переноситься — це свідома ціна такої архітектури, а не недоопрацювання.',
    more: 'ЩЕ ПРО ПРОЄКТ',
  },
  en: {
    title: 'Privacy',
    lead: 'Nothing you do here leaves your device. This is not a promise in a privacy policy but a property of the architecture: there is simply nowhere to send that data, because no backend exists.',
    s01: '01 — WHY THIS IS A PROPERTY, NOT A PROMISE',
    s01title: 'Nowhere to send it — there is no server',
    s01p: 'A promise can be broken quietly — the absence of a server cannot: you can check it yourself by opening the browser\'s Network panel and keying something. You will not find a request carrying your text, your audio or your progress, because no address exists to send it to.',
    points: [
      { code: '·−', text: 'Microphone audio is processed locally and stored nowhere' },
      { code: '−···', text: 'Audio files are not uploaded — they are read right in the tab' },
      {
        code: '−·−·',
        text: "Learning progress lives in your browser's localStorage and is synced nowhere",
      },
      {
        code: '−··',
        text: 'The one thing that does go out is Google Analytics: which pages were opened, where the visit came from, what kind of device. No advertising, no profiling',
      },
    ],
    s02: '02 — WHAT IS ABSENT',
    s02title: 'No accounts, no sync',
    s02p: 'There is no sign-up, because nothing needs to be stored on someone else\'s side. The consequence is that nothing travels between devices — a deliberate cost of this architecture, not an omission.',
    more: 'MORE ABOUT THE PROJECT',
  },
} as const

export function AboutPrivacy() {
  const { lang } = useLang()
  const c = CONTENT[lang]

  return (
    <div className="page shell">
      <PageHead call={callsFor(lang).aboutPrivacy} title={c.title} lead={c.lead} />

      <div className="about">
        <section className="about-sec">
          <span className="micro about-sec__label">{c.s01}</span>
          <h2 className="h2">{c.s01title}</h2>
          <div className="prose">
            <p>{c.s01p}</p>
          </div>
          <ul className="plist">
            {c.points.map((point) => (
              <li key={point.text} data-code={point.code}>
                {point.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.s02}</span>
          <h2 className="h2">{c.s02title}</h2>
          <div className="prose">
            <p>{c.s02p}</p>
          </div>
        </section>

        <section className="about-sec">
          <span className="micro about-sec__label">{c.more}</span>
          <AboutNav />
        </section>
      </div>
    </div>
  )
}
