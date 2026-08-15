import { useCallback, useEffect, useRef, useState } from 'react'

export function useApi(fetcher, { immediate = true, deps = [] } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetcherRef.current()
      const d = res?.data?.data ?? res?.data ?? res
      setData(d)
      return d
    } catch (e) {
      setError(e)
      return null
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (immediate) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refreshing, load, reload: load, setData }
}

export function useList(fetcher, { deps = [], pageSize = 12 } = {}) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, current_page: 1, last_page: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const run = useCallback(
    async (targetPage, silent = false) => {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const res = await fetcher(targetPage, pageSize)
        const payload = res?.data
        const list = payload?.data?.data ?? payload?.data ?? payload
        const m =
          payload?.data?.meta ||
          payload?.meta?.pagination ||
          payload?.pagination || {
            total: 0,
            current_page: targetPage,
            last_page: 1,
          }
        setItems(Array.isArray(list) ? list : [])
        setMeta({
          total: m.total ?? m.current ?? 0,
          current_page: m.current_page ?? targetPage,
          last_page: m.last_page ?? m.lastPage ?? 1,
          per_page: m.per_page ?? pageSize,
        })
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [fetcher, pageSize],
  )

  useEffect(() => {
    run(page)
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
