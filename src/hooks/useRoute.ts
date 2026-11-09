import { useEffect, useState } from 'react'
import { parseRoute, type Route } from '../lib/router'

/** Текущий маршрут по hash; обновляется при переходах назад/вперёд и по ссылкам */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
