import { useState, useEffect, useCallback } from 'react'

export function useFetch(url, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(() => {
    if (!url) return
    setLoading(true)
    fetch(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e); setLoading(false) })
  }, [url, ...deps])

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch }
}

export const api = {
  get: (url) => fetch(url).then(r => r.json()),
  post: (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d }),
  put: (url, body) => fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`); return d }),
  delete: (url) => fetch(url, { method: 'DELETE' }).then(r => r.json()),
}
