import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import { useState } from 'react'

import { HttpMethod, KeyValueItem } from '../../types'

const Playground = () => {
  // Core request state
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState<HttpMethod>('GET')

  // Tabs
  const [tabValue, setTabValue] = useState(0)

  // Params & Headers
  const [params, setParams] = useState<KeyValueItem[]>([
    { id: 1, key: '', value: '' }
  ])
  const [headers, setHeaders] = useState<KeyValueItem[]>([
    { id: 1, key: '', value: '' }
  ])

  // Auth
  const [useAuth, setUseAuth] = useState(false)
  const [authToken, setAuthToken] = useState('')

  // Body
  const [body, setBody] = useState('')

  // Response
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<number | null>(null)
  const [time, setTime] = useState<number | null>(null)
  const [size, setSize] = useState<number | null>(null)

  // Handlers for dynamic items (Params, Headers)
  const addParam = () => {
    setParams(prev => [...prev, { id: Date.now(), key: '', value: '' }])
  }
  const removeParam = (id: number) => {
    setParams(prev => prev.filter(p => p.id !== id))
  }
  const changeParam = (id: number, field: 'key' | 'value', val: string) => {
    setParams(prev => prev.map(p => (p.id === id ? { ...p, [field]: val } : p)))
  }

  const addHeader = () => {
    setHeaders(prev => [...prev, { id: Date.now(), key: '', value: '' }])
  }
  const removeHeader = (id: number) => {
    setHeaders(prev => prev.filter(h => h.id !== id))
  }
  const changeHeader = (id: number, field: 'key' | 'value', val: string) => {
    setHeaders(prev =>
      prev.map(h => (h.id === id ? { ...h, [field]: val } : h))
    )
  }

  // --- Build final URL with query params ---
  const buildUrlWithParams = () => {
    const validParams = params.filter(p => p.key && p.value)
    if (!validParams.length) return url

    const qs = validParams
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join('&')

    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}${qs}`
  }

  // --- Handle the actual request ---
  const handleSendRequest = async () => {
    if (!url) {
      setError('Please enter a URL.')
      setResponse(null)
      return
    }
    setError(null)
    setResponse(null)
    setStatus(null)
    setTime(null)
    setSize(null)

    const finalUrl = buildUrlWithParams()

    // Build the headers object
    const headersObj: Record<string, string> = {}
    headers.forEach(h => {
      if (h.key && h.value) {
        headersObj[h.key] = h.value
      }
    })
    if (useAuth && authToken.trim()) {
      headersObj['Authorization'] = `Bearer ${authToken}`
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headersObj
      }
    }

    if (method !== 'GET' && method !== 'DELETE' && body.trim()) {
      try {
        const parsed = JSON.parse(body)
        options.body = JSON.stringify(parsed)
      } catch {
        setError('Invalid JSON in request body.')
        return
      }
    }

    const startTime = performance.now()
    try {
      const res = await fetch(finalUrl, options)
      const endTime = performance.now()

      setStatus(res.status)
      setTime(parseFloat((endTime - startTime).toFixed(2)))

      const contentType = res.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await res.json()
        : await res.text()

      // Calculate size
      let dataStr: string
      if (typeof data === 'object') {
        dataStr = JSON.stringify(data)
      } else {
        dataStr = data
      }
      setSize(new Blob([dataStr]).size)

      if (!res.ok) {
        setError(`Error (${res.status}): ${dataStr}`)
      } else {
        setResponse(data)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Box display='flex' flexDirection='column' height='100vh'>
      {/* TOP BAR */}
      <Paper
        square
        sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}
      >
        {/* Method Select */}
        <FormControl size='small' sx={{ width: 100 }}>
          <InputLabel>Method</InputLabel>

          <Select
            label='Method'
            value={method}
            onChange={e => setMethod(e.target.value as HttpMethod)}
          >
            <MenuItem value='GET'>GET</MenuItem>
            <MenuItem value='POST'>POST</MenuItem>
            <MenuItem value='PUT'>PUT</MenuItem>
            <MenuItem value='PATCH'>PATCH</MenuItem>
            <MenuItem value='DELETE'>DELETE</MenuItem>
          </Select>
        </FormControl>

        {/* URL Input */}
        <TextField
          label='Request URL'
          size='small'
          fullWidth
          value={url}
          onChange={e => setUrl(e.target.value)}
        />

        {/* Send Button */}
        <Button variant='contained' color='primary' onClick={handleSendRequest}>
          Send
        </Button>
      </Paper>

      {/* MAIN CONTENT: TABS + RESPONSE */}
      <Box flex='1' overflow='auto' display='flex'>
        {/* LEFT SIDE: Tabs for Params/Auth/Headers/Body */}
        <Box width='50%' borderRight='1px solid #ddd'>
          <Tabs
            value={tabValue}
            onChange={(_, newVal) => setTabValue(newVal)}
            textColor='primary'
            indicatorColor='primary'
          >
            <Tab label='Params' />
            <Tab label='Auth' />
            <Tab label='Headers' />
            <Tab label='Body' />
          </Tabs>

          <Divider />

          {tabValue === 0 && (
            <Box p={2}>
              {params.map(p => (
                <Box key={p.id} display='flex' gap={1} mb={1}>
                  <TextField
                    label='Key'
                    size='small'
                    value={p.key}
                    onChange={e => changeParam(p.id, 'key', e.target.value)}
                  />
                  <TextField
                    label='Value'
                    size='small'
                    value={p.value}
                    onChange={e => changeParam(p.id, 'value', e.target.value)}
                  />
                  <IconButton color='error' onClick={() => removeParam(p.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                size='small'
                startIcon={<AddIcon />}
                onClick={addParam}
                variant='outlined'
              >
                Add Param
              </Button>
            </Box>
          )}

          {tabValue === 1 && (
            <Box p={2}>
              <Box display='flex' alignItems='center' gap={1} mb={2}>
                <Checkbox
                  checked={useAuth}
                  onChange={e => setUseAuth(e.target.checked)}
                />
                <Typography>Use Bearer Token</Typography>
              </Box>
              {useAuth && (
                <TextField
                  label='Token'
                  size='small'
                  fullWidth
                  value={authToken}
                  onChange={e => setAuthToken(e.target.value)}
                />
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box p={2}>
              {headers.map(h => (
                <Box key={h.id} display='flex' gap={1} mb={1}>
                  <TextField
                    label='Header Key'
                    size='small'
                    value={h.key}
                    onChange={e => changeHeader(h.id, 'key', e.target.value)}
                  />
                  <TextField
                    label='Header Value'
                    size='small'
                    value={h.value}
                    onChange={e => changeHeader(h.id, 'value', e.target.value)}
                  />
                  <IconButton color='error' onClick={() => removeHeader(h.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                size='small'
                variant='outlined'
                startIcon={<AddIcon />}
                onClick={addHeader}
              >
                Add Header
              </Button>
            </Box>
          )}

          {tabValue === 3 && (
            <Box p={2}>
              {(method === 'GET' || method === 'DELETE') && (
                <Typography variant='body2' color='text.secondary' mb={1}>
                  Typically, GET/DELETE requests don't have a body.
                </Typography>
              )}
              <TextField
                label='JSON Body'
                size='small'
                fullWidth
                multiline
                rows={6}
                value={body}
                onChange={e => setBody(e.target.value)}
              />
            </Box>
          )}
        </Box>

        {/* RIGHT SIDE: RESPONSE PANEL */}
        <Box width='50%' p={2} overflow='auto'>
          <Typography variant='h6' gutterBottom>
            Response
          </Typography>

          {/* Status / Time / Size */}
          <Box display='flex' gap={4} mb={2}>
            <Typography>
              <strong>Status:</strong> {status !== null ? status : '--'}
            </Typography>
            <Typography>
              <strong>Time:</strong> {time !== null ? `${time} ms` : '--'}
            </Typography>
            <Typography>
              <strong>Size:</strong> {size !== null ? `${size} bytes` : '--'}
            </Typography>
          </Box>

          {/* Error or Response */}
          {error && (
            <Card variant='outlined' sx={{ mb: 2 }}>
              <CardContent>
                <Typography color='error' whiteSpace='pre-wrap'>
                  {error}
                </Typography>
              </CardContent>
            </Card>
          )}

          {!error && response && (
            <Card variant='outlined'>
              <CardContent>
                <Typography
                  component='pre'
                  whiteSpace='pre-wrap'
                  fontSize='0.875rem'
                >
                  {typeof response === 'object'
                    ? JSON.stringify(response, null, 2)
                    : String(response)}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default Playground
