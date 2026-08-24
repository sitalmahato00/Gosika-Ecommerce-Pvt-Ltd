import { useCallback, useEffect, useRef, useState } from 'react'
import { getCached, setCached } from '../utils/adminCache'

export function useApi(fetcher, { immediate = true, deps = [], cacheKey = null } = {}) {
  const cached = cacheKey ? getCached(cacheKey)?.data : null
  const [data, setData] = useState(cached || null)
  const [loading, setLoading] = useState(immediate && !cached)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(Boolean(cached))
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent || data) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetcherRef.current()
      const d = res?.data?.data ?? res?.data ?? res
      setData(d)
      if (cacheKey) setCached(cacheKey, d)
      return d
    } catch (e) {
      setError(e)
      return null
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [cacheKey, data])

  useEffect(() => {
    if (immediate) load({ silent: Boolean(cached) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refreshing, load, reload: load, setData }
}

export function useList(fetcher, { deps = [], pageSize = 12, cacheKey = null } = {}) {
  const cached = cacheKey ? getCached(cacheKey)?.data : null
  const [items, setItems] = useState(cached?.items || [])
  const [meta, setMeta] = useState(cached?.meta || { total: 0, current_page: 1, last_page: 1 })
  const [page, setPage] = useState(cached?.page || 1)
  const [loading, setLoading] = useState(!cached || (cached?.items?.length === 0))
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(Boolean(cached?.items?.length))

  const run = useCallback(
    async (targetPage, silent = false) => {
      if (silent || items.length > 0) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const res = await fetcher(targetPage, pageSize)
        const payload = res?.data
        const list = payload?.data?.data ?? payload?.data ?? payload
        const m =
          payload?.meta?.pagination ||
          payload?.data?.meta ||
          payload?.meta ||
          payload?.pagination || {
            total: 0,
            current_page: targetPage,
            last_page: 1,
          }
        const nextItems = Array.isArray(list) ? list : []
        const nextMeta = {
          total: m.total ?? m.current ?? 0,
          current_page: m.current_page ?? targetPage,
          last_page: m.last_page ?? m.lastPage ?? 1,
          per_page: m.per_page ?? pageSize,
        }
        setItems(nextItems)
        setMeta(nextMeta)
        if (cacheKey) {
          setCached(cacheKey, { items: nextItems, meta: nextMeta, page: targetPage })
        }
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [fetcher, pageSize, cacheKey, items.length],
  )

  useEffect(() => {
    run(page, Boolean(cached?.items?.length))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ...deps])

  return {
    items,
    meta,
    page,
    setPage,
    loading,
    refreshing,
    error,
    reload: () => run(page, true),
    setItems,
  }
}

