export function jsonResponse(body, status = 200) {
  return Response.json(body, { status })
}

export async function parseRequestBody(request) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json()
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    return { text, audio: null }
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const textField = formData.get('text')
    const audio = formData.get('audio')

    const text =
      typeof textField === 'string'
        ? textField.trim()
        : textField != null
          ? String(textField).trim()
          : ''

    const audioFile =
      audio && typeof audio === 'object' && 'arrayBuffer' in audio ? audio : null

    return { text, audio: audioFile }
  }

  throw new Error(
    'Unsupported Content-Type. Use application/json or multipart/form-data.',
  )
}
