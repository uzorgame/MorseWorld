import type { ReactNode } from 'react'
import { CallSign, type Call } from '../components/shell/CallSign'
import './pages.css'

type Props = {
  /** Позивний сторінки — морзянка з розшифровкою. Замінює собою службовий бейдж. */
  call: Call
  title: string
  lead: string
  aside?: ReactNode
}

export function PageHead({ call, title, lead, aside }: Props) {
  return (
    <div className="page__head">
      <CallSign morse={call.morse} label={call.label} />
      <h1 className="h1">{title}</h1>
      <p className="lead">{lead}</p>
      {aside}
    </div>
  )
}
