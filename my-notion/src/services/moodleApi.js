export async function fetchMoodleSnapshot(token) {
    const response = await fetch('/api/moodle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({ token }),
    })

    let payload = null
    try {
        payload = await response.json()
    } catch {
        payload = null
    }

    if (!response.ok) {
        throw new Error(payload?.error || 'Unable to sync Moodle right now.')
    }

    return payload
}
