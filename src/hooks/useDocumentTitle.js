import { useEffect } from 'react'
import { SHOP_NAME } from '../constants'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - ${SHOP_NAME}` : SHOP_NAME
  }, [title])
}
