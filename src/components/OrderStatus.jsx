import { ORDER_STATUS } from '../constants'

// Метка статуса. audience: 'customer' (покупатель) или 'admin' (администратор)
export default function OrderStatus({ status, audience = 'customer' }) {
  const label = ORDER_STATUS[status]?.[audience] || status
  return <span className={`status status--${status}`}>{label}</span>
}
