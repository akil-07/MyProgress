import useTaskStore from '../store/taskStore.js'
import usePageStore from '../store/pageStore.js'
import useAcademicStore from '../store/academicStore.js'

const API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY
const BASE_URL = 'https://api.cerebras.ai/v1'
const MODEL    = 'llama3.1-8b'   // Cerebras' fastest model

export const isCerebrasConfigured = !!API_KEY

/* ── Build rich system prompt from live app state ─────── */
function buildSystemPrompt() {
    const tasks   = useTaskStore.getState().tasks
    const pages   = usePageStore.getState().pages
    const { subjects, assignments, semester } = useAcademicStore.getState()

    const activeTasks    = tasks.filter(t => !t.completed).map(t => `- ${t.title}`).join('\n') || 'None'
    const allPages       = pages.map(p => `- ${p.title || 'Untitled'}`).join('\n') || 'None'
    const pendingAssign  = assignments.filter(a => a.status !== 'submitted')
        .map(a => `- ${a.title} | ${a.subject} | Due: ${a.dueDate} | Priority: ${a.priority}`).join('\n') || 'None'
    const subjectList    = subjects.map(s => `- ${s.name} (target: ${s.target}%)`).join('\n') || 'None'
    const semInfo        = semester.startDate
        ? `${semester.startDate} → ${semester.endDate || 'not set'}`
        : 'Not configured'

    return `You are the MyNotion AI Assistant — an intelligent academic companion integrated into the student's personal workspace.
You are powered by Cerebras inference (llama3.1-8b) and respond instantly.

STUDENT'S CURRENT WORKSPACE STATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Active Tasks:
${activeTasks}

📄 Pages in Workspace:
${allPages}

📚 Subjects Being Tracked:
${subjectList}

📝 Pending Assignments:
${pendingAssign}

🗓️ Semester: ${semInfo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GUIDELINES:
- Be concise, helpful, and friendly. Use simple language — you're talking to a student.
- You can see the student's full academic context above. Use it to give personalised advice.
- Help with: attendance calculations, assignment planning, study tips, timetable advice, summarisation, Q&A.
- When asked about attendance, use the subject data above to give specific, accurate advice.
- If the semester data isn't set, remind them to configure it in Semester Planner.
- Keep responses short unless the student asks for detail. Use bullet points and emojis where appropriate.
- Today's date is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}.`
}

/* ── Non-streaming request (fallback) ─────────────────── */
export async function askCerebras(messages) {
    if (!API_KEY) throw new Error('Cerebras API key not set. Add VITE_CEREBRAS_API_KEY to your .env file.')

    const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
            ],
            max_completion_tokens: 1024,
            temperature: 0.7,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Cerebras API error ${res.status}: ${err}`)
    }

    const data = await res.json()
    return data.choices[0].message.content
}

/* ── Streaming request — calls onChunk(text) as tokens arrive ── */
export async function askCerebrasStream(messages, onChunk, signal) {
    if (!API_KEY) throw new Error('Cerebras API key not set. Add VITE_CEREBRAS_API_KEY to your .env file.')

    const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            stream: true,
            messages: [
                { role: 'system', content: buildSystemPrompt() },
                ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
            ],
            max_completion_tokens: 1024,
            temperature: 0.7,
        }),
    })

    if (!res.ok) {
        const err = await res.text()
        throw new Error(`Cerebras API error ${res.status}: ${err}`)
    }

    const reader  = res.body.getReader()
    const decoder = new TextDecoder()
    let full = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
            const text = line.slice(6).trim()
            if (text === '[DONE]') continue
            try {
                const json  = JSON.parse(text)
                const delta = json.choices?.[0]?.delta?.content
                if (delta) {
                    full += delta
                    onChunk(full)
                }
            } catch {
                // skip malformed SSE lines
            }
        }
    }

    return full
}

/* ── Document Writer functions (for Editor slash commands) ── */
export async function askCerebrasRaw(prompt) {
    if (!API_KEY) throw new Error("Cerebras API key is missing.");
    return askCerebras([{ role: 'user', content: prompt }]);
}

export async function continueDocWriting(context) {
    const prompt = `Given the following document text, continue writing the next paragraph that naturally flows from it. Do not include introductory text, just provide the continuation.\n\nContext:\n${context}`;
    return askCerebrasRaw(prompt);
}

export async function summarizeDocText(text) {
    const prompt = `Please summarize the following text concisely:\n\n${text}\n\nSummary:`;
    return askCerebrasRaw(prompt);
}
