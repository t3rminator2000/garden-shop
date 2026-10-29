import { Link } from 'react-router-dom'
import { CONTACTS, INFO_LINKS } from '../constants'

// Подвал из макета: Контакты, Покупателям, Каталог, Мы в соцсетях
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <section>
          <h2 className="footer__title">Контакты</h2>
          <ul>
            <li><a href={`tel:${CONTACTS.phone.replace(/[^\d+]/g, '')}`}>{CONTACTS.phone}</a></li>
            <li><a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a></li>
            <li className="footer__muted">{CONTACTS.hours}</li>
          </ul>
        </section>
        <section>
          <h2 className="footer__title">Покупателям</h2>
          <ul>
            {INFO_LINKS.map((l) => (
              <li key={l.slug}><Link to={`/info/${l.slug}`}>{l.title}</Link></li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="footer__title">Каталог</h2>
          <ul>
            <li><Link to="/catalog/seeds-vegetables">Семена</Link></li>
            <li><Link to="/catalog/saplings">Саженцы</Link></li>
            <li><Link to="/catalog/fertilizers">Удобрения</Link></li>
          </ul>
        </section>
        <section>
          <h2 className="footer__title">Мы в соцсетях</h2>
          {/* Ссылки-заглушки из макета: настоящие адреса подставляются при запуске магазина */}
          <ul>
            <li><span className="footer__stub">Ссылка 1</span></li>
            <li><span className="footer__stub">Ссылка 2</span></li>
          </ul>
        </section>
      </div>
    </footer>
  )
}
