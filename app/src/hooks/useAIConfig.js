import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

const AI_PROVIDERS_KEY = 'luxio-ai-providers-cache'
const ACTIVE_PROVIDER_KEY = 'luxio-active-provider-id'

export function useAIConfig() {
  const [providers, setProviders] = useState([])
  const [activeProvider, setActiveProviderState] = useState(null)
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProviders = useCallback(async () => {
    try {
      const res = await api.getAIProviders()
      const list = res.providers || []
      setProviders(list)

      const cachedId = localStorage.getItem(ACTIVE_PROVIDER_KEY)
      const active = list.find((p) => p.is_active) || list.find((p) => p.id === cachedId) || list[0]
      if (active) {
        setActiveProviderState(active)
        localStorage.setItem(ACTIVE_PROVIDER_KEY, active.id)
        if (active.model) {
          setModels(active.model.split(',').map((m) => m.trim()).filter(Boolean))
        }
      }
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const setActiveProvider = useCallback(async (provider) => {
    setActiveProviderState(provider)
    localStorage.setItem(ACTIVE_PROVIDER_KEY, provider.id)

    if (provider.model) {
      setModels(provider.model.split(',').map((m) => m.trim()).filter(Boolean))
    } else {
      setModels([])
    }

    try {
      await api.updateAIProvider(provider.id, { is_active: true })
      await loadProviders()
    } catch (_) {}
  }, [loadProviders])

  const refreshModels = useCallback(async (providerId, baseUrl, apiKey, apiType) => {
    if (!baseUrl) return []
    try {
      const base = baseUrl.replace(/\/+$/, '').replace(/\/models$/, '')
      let list = []
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (apiType === 'anthropic-messages') {
          headers['x-api-key'] = apiKey.trim()
          headers['anthropic-version'] = '2023-06-01'
        } else {
          headers['Authorization'] = `Bearer ${apiKey.trim()}`
        }
        const res = await fetch(`${base}/models`, { method: 'GET', headers })
        if (res.ok) {
          const body = await res.json()
          if (Array.isArray(body.data)) list = body.data.map((m) => (m && (m.id || m.model)) || null).filter(Boolean)
          else if (Array.isArray(body)) list = body.map((m) => (m && (m.id || m.name)) || null).filter(Boolean)
          else if (body.models && Array.isArray(body.models)) list = body.models.map((m) => (typeof m === 'string' ? m : (m && m.id) || null)).filter(Boolean)
          list = list.map(String)
        }
      } catch {}
      if (list.length === 0) {
        const res = await api.fetchAIModels({ api_type: apiType, base_url: base, api_key: apiKey.trim() })
        list = res.models || []
      }
      setModels(list)
      return list
    } catch {
      return []
    }
  }, [])

  const getConfig = useCallback(() => {
    if (!activeProvider) return null
    return {
      providerId: activeProvider.id,
      api_type: activeProvider.api_type || 'openai-compatible',
      base_url: activeProvider.base_url || '',
      model: activeProvider.model || '',
    }
  }, [activeProvider])

  return {
    providers,
    activeProvider,
    setActiveProvider,
    models,
    refreshModels,
    getConfig,
    loading,
    reload: loadProviders,
  }
}

export function useAIConfigLocal() {
  const [config, setConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('luxio-ai-config')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })

  const saveConfig = useCallback((cfg) => {
    try {
      localStorage.setItem('luxio-ai-config', JSON.stringify(cfg))
      setConfig(cfg)
    } catch {}
  }, [])

  return { config, saveConfig }
}