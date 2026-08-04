import Reveal from '../Reveal'
import { IconChat, IconImage, IconStatement } from '../Icons'

/**
 * The three evidence types the prototype actually supports. Deliberately
 * three and not "and more" — the scope is real and the page should not
 * promise past it.
 */
const TYPES = [
  {
    id: 'whatsapp',
    icon: <IconChat />,
    title: 'WhatsApp export',
    body: 'Drop in a chat export. Argus reads the conversation, lifts out names, phone numbers, UPI IDs and amounts, and orders every message by timestamp.',
    tag: 'chat.txt',
  },
  {
    id: 'screenshot',
    icon: <IconImage />,
    title: 'Screenshot',
    body: 'Payment confirmations, profile pages, SMS. Tesseract reads the text off the image, then entity extraction keeps the parts that matter to a complaint.',
    tag: '.png / .jpg',
  },
  {
    id: 'statement',
    icon: <IconStatement />,
    title: 'Bank statement',
    body: 'Transactions, references and counterparties — checked against what the conversation claims happened, so the two can disagree in public.',
    tag: '.pdf / .csv',
  },
]

export default function EvidenceTypes() {
  return (
    <section className="section" id="evidence">
      <div className="section__inner">
        <Reveal className="section__head">
          <p className="eyebrow label-caps">What you can upload</p>
          <h2 className="section__title">
            Three kinds of evidence. <em>One</em> case file.
          </h2>
          <p className="section__lede lead">
            Everything lands in the same case, on the same timeline, whether it started as a chat,
            a photo or a bank record.
          </p>
        </Reveal>

        {/* Input enters from the left — the same direction the pipeline runs. */}
        <div className="card-grid">
          {TYPES.map((type, i) => (
            <Reveal key={type.id} from="left" delay={i * 0.08} className="card">
              <span className="card__icon">{type.icon}</span>
              <h3 className="card__title">{type.title}</h3>
              <p className="card__body">{type.body}</p>
              <div className="card__foot">
                <span className="card__tag">{type.tag}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
