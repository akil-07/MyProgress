import useTaskStore from '../store/taskStore.js'
import usePageStore from '../store/pageStore.js'
import useAcademicStore from '../store/academicStore.js'

const API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY
const BASE_URL = 'https://api.cerebras.ai/v1'
const MODEL    = 'llama3.1-8b'   // Cerebras' fastest model

export const isCerebrasConfigured = !!API_KEY

/* ── AI Tools Definitions ─────────────────────────────── */
const TOOLS = [
    {
        type: 'function',
        function: {
            name: "addTask",
            description: "Add a new task to the user's todo list.",
            parameters: { type: "object", properties: { title: { type: "string" }, category: { type: "string", description: "Default is 'General'" } }, required: ["title"] }
        }
    },
    {
        type: 'function',
        function: {
            name: "completeTask",
            description: "Mark a task as completed. Pass a partial or full title of the task to complete.",
            parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] }
        }
    },
    {
        type: 'function',
        function: {
            name: "createPage",
            description: "Create a new document page.",
            parameters: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } }, required: ["title"] }
        }
    },
    {
        type: 'function',
        function: {
            name: "addAssignment",
            description: "Add an academic assignment.",
            parameters: { type: "object", properties: { title: { type: "string" }, subject: { type: "string" }, dueDate: { type: "string", description: "YYYY-MM-DD format" }, priority: { type: "string", description: "high|medium|low" } }, required: ["title"] }
        }
    },
    {
        type: 'function',
        function: {
            name: "addSubject",
            description: "Add a new subject to track attendance for.",
            parameters: { type: "object", properties: { name: { type: "string" }, targetPercentage: { type: "number", description: "e.g. 80" } }, required: ["name"] }
        }
    },
    {
        type: 'function',
        function: {
            name: "updateAttendance",
            description: "Add conducted and attended classes/hours to an existing subject.",
            parameters: { type: "object", properties: { subjectName: { type: "string" }, conductedToAdd: { type: "number", description: "Number of classes/hours conducted" }, attendedToAdd: { type: "number", description: "Number of classes/hours the user attended" } }, required: ["subjectName", "conductedToAdd", "attendedToAdd"] }
        }
    },
    {
        type: 'function',
        function: {
            name: "updateTimetableSlot",
            description: "Assign a subject to a specific timetable slot. 5 slots per day.",
            parameters: { type: "object", properties: { day: { type: "number", description: "1 (Mon) to 6 (Sat)" }, slot: { type: "number", description: "0 to 4 (5 slots per day)" }, subjectName: { type: "string" } }, required: ["day", "slot", "subjectName"] }
        }
    }
]

function executeTool(name, args) {
    if (name === 'addTask') {
        useTaskStore.getState().addTask(args.title, args.category || 'General')
        return { success: true, message: `Added task: ${args.title}` }
    }
    if (name === 'completeTask') {
        const { tasks, toggleTask } = useTaskStore.getState()
        const found = tasks.find(t => t.title.toLowerCase().includes(args.title.toLowerCase()) && !t.completed)
        if (found) { toggleTask(found.id); return { success: true, message: `Completed task: ${found.title}` } }
        return { success: false, error: `Task not found matching: ${args.title}` }
    }
    if (name === 'createPage') {
        const state = usePageStore.getState()
        const id = state.createPage()
        const update = { title: args.title }
        if (args.content) update.content = [{ id: crypto.randomUUID(), type: 'p', text: args.content }]
        state.updatePage(id, update)
        return { success: true, message: `Created page: ${args.title}` }
    }
    if (name === 'addAssignment') {
        useAcademicStore.getState().addAssignment({ title: args.title, subject: args.subject || '', dueDate: args.dueDate || new Date().toISOString().slice(0, 10), priority: args.priority || 'medium' })
        return { success: true, message: `Added assignment: ${args.title}` }
    }
    if (name === 'addSubject') {
        useAcademicStore.getState().addSubject(args.name, '#7c5cfc', args.targetPercentage || 80)
        return { success: true, message: `Added subject: ${args.name}` }
    }
    if (name === 'updateAttendance') {
        const state = useAcademicStore.getState()
        const s = state.subjects.find(s => s.name.toLowerCase().includes(args.subjectName.toLowerCase()))
        if (s) {
            state.updateSubject(s.id, { conducted: (s.conducted || 0) + (args.conductedToAdd || 0), attended: (s.attended || 0) + (args.attendedToAdd || 0) })
            return { success: true, message: `Updated attendance for ${s.name}: +${args.conductedToAdd} conducted, +${args.attendedToAdd} attended` }
        }
        return { success: false, error: `Subject ${args.subjectName} not found` }
    }
    if (name === 'updateTimetableSlot') {
        const state = useAcademicStore.getState()
        const s = state.subjects.find(sub => sub.name.toLowerCase().includes(args.subjectName.toLowerCase()))
        if (!s) return { success: false, error: `Subject ${args.subjectName} not found` }
        if (args.day < 1 || args.day > 6 || args.slot < 0 || args.slot > 4) return { success: false, error: `Invalid day/slot` }
        state.updateTimetableSlot(args.day, args.slot, s.id)
        return { success: true, message: `Updated timetable day ${args.day} slot ${args.slot}` }
    }
    return { success: false, error: "Unknown tool" }
}

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

CRITICAL GUIDELINES:
- **USE YOUR TOOLS**: If the user asks you to add a task, mark a task done, create a page, add an assignment, add a subject, update their timetable, or update their attendance, YOU MUST USE THE CORRESPONDING TOOL. Do not just reply "I've done it" without actually calling the tool!
- Give a brief confirmation message *after* calling a tool, letting the user know it was successfully changed in the app.
- Be concise, helpful, and friendly. Use simple language.
- Today's date is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}.`
}

/* ── Non-streaming request (fallback) ─────────────────── */
export async function askCerebras(messages) {
    if (!API_KEY) throw new Error('Cerebras API key not set.')

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

    if (!res.ok) throw new Error(`Cerebras API error ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content
}

/* ── Streaming request with FULL TOOL CALLING SUPPORT ── */
export async function askCerebrasStream(messages, onChunk, signal) {
    if (!API_KEY) throw new Error('Cerebras API key not set.')

    let currentMessages = [
        { role: 'system', content: buildSystemPrompt() },
        ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ]

    let totalContent = ''

    // Allows up to 5 consecutive tool calls before stopping
    for (let loopCount = 0; loopCount < 5; loopCount++) {
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
                messages: currentMessages,
                tools: TOOLS,
                max_completion_tokens: 1024,
                temperature: 0.7,
            }),
        })

        if (!res.ok) throw new Error(`Cerebras API error ${res.status}: ${await res.text()}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        
        // Loop vars
        let loopContent = ''
        let toolCallsAcc = {}

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

            for (const line of lines) {
                const text = line.slice(6).trim()
                if (text === '[DONE]') continue
                try {
                    const json = JSON.parse(text)
                    const delta = json.choices?.[0]?.delta

                    if (delta?.content) {
                        loopContent += delta.content
                        totalContent += delta.content
                        onChunk(totalContent)
                    }

                    if (delta?.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            if (!toolCallsAcc[tc.index]) {
                                toolCallsAcc[tc.index] = { id: tc.id, name: tc.function?.name || '', arguments: '' }
                            }
                            if (tc.function?.arguments) {
                                toolCallsAcc[tc.index].arguments += tc.function.arguments
                            }
                        }
                    }
                } catch { }
            }
        }

        const callsArray = Object.values(toolCallsAcc)
        if (callsArray.length > 0) {
            // function was called! Append assistant message with tool_calls
            currentMessages.push({
                role: 'assistant',
                content: loopContent || null,
                tool_calls: callsArray.map(c => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.arguments } }))
            })

            for (const call of callsArray) {
                let args = {}
                try { args = JSON.parse(call.arguments) } catch (e) {}
                console.log("Cerebras Tool Called:", call.name, args)
                const result = executeTool(call.name, args)
                currentMessages.push({
                    role: 'tool',
                    tool_call_id: call.id,
                    name: call.name,
                    content: JSON.stringify(result)
                })
            }
            // re-run the loop with tool results to get the real answer stream
            continue
        } else {
            // no tool calls, generation is completely finished
            return totalContent
        }
    }
    return totalContent
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
