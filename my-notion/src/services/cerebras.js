import useTaskStore from '../store/taskStore.js'
import usePageStore from '../store/pageStore.js'
import useAcademicStore from '../store/academicStore.js'

const API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY
const BASE_URL = 'https://api.cerebras.ai/v1'
const MODEL    = 'llama3.1-8b'

export const isCerebrasConfigured = !!API_KEY

/* ── AI Tools Definitions ─────────────────────────────── */
const TOOLS = [
    {
        type: 'function',
        function: { name: "addTask", description: "Add a new task to the user's todo list.", parameters: { type: "object", properties: { title: { type: "string" }, category: { type: "string", description: "Default is 'General'" } }, required: ["title"] } }
    },
    {
        type: 'function',
        function: { name: "completeTask", description: "Mark a task as completed. Pass a partial or full title.", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } }
    },
    {
        type: 'function',
        function: { name: "deleteTask", description: "Delete a task completely.", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } }
    },
    {
        type: 'function',
        function: { name: "createPage", description: "Create a new document page.", parameters: { type: "object", properties: { title: { type: "string" }, content: { type: "string" } }, required: ["title"] } }
    },
    {
        type: 'function',
        function: { name: "addAssignment", description: "Add an academic assignment.", parameters: { type: "object", properties: { title: { type: "string" }, subject: { type: "string" }, dueDate: { type: "string", description: "YYYY-MM-DD" }, priority: { type: "string", description: "high|medium|low" } }, required: ["title"] } }
    },
    {
        type: 'function',
        function: { name: "completeAssignment", description: "Mark an assignment as submitted/completed.", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } }
    },
    {
        type: 'function',
        function: { name: "deleteAssignment", description: "Delete an assignment completely.", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } }
    },
    {
        type: 'function',
        function: { name: "addSubject", description: "Add a new subject.", parameters: { type: "object", properties: { name: { type: "string" }, targetPercentage: { type: "number", description: "e.g. 80" } }, required: ["name"] } }
    },
    {
        type: 'function',
        function: { name: "deleteSubject", description: "Delete a subject completely.", parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"] } }
    },
    {
        type: 'function',
        function: { name: "updateAttendance", description: "Add conducted and attended classes/hours to an existing subject.", parameters: { type: "object", properties: { subjectName: { type: "string" }, conductedToAdd: { type: "number" }, attendedToAdd: { type: "number" } }, required: ["subjectName", "conductedToAdd", "attendedToAdd"] } }
    },
    {
        type: 'function',
        function: { name: "updateTimetableSlot", description: "Assign a subject to a specific timetable slot. 5 slots per day.", parameters: { type: "object", properties: { day: { type: "number", description: "1 (Mon) to 6 (Sat)" }, slot: { type: "number", description: "0 to 4" }, subjectName: { type: "string" } }, required: ["day", "slot", "subjectName"] } }
    },
    {
        type: 'function',
        function: { name: "updateSemester", description: "Update the semester start and end dates.", parameters: { type: "object", properties: { startDate: { type: "string", description: "YYYY-MM-DD" }, endDate: { type: "string", description: "YYYY-MM-DD" } }, required: ["startDate", "endDate"] } }
    }
]

function executeTool(name, args) {
    const tStore = useTaskStore.getState()
    const pStore = usePageStore.getState()
    const aStore = useAcademicStore.getState()

    if (name === 'addTask') {
        tStore.addTask(args.title, args.category || 'General')
        return { success: true, message: `Added task: ${args.title}` }
    }
    if (name === 'completeTask' || name === 'deleteTask') {
        const found = tStore.tasks.find(t => t.title.toLowerCase().includes(args.title.toLowerCase()) && !t.completed)
        if (!found) return { success: false, error: `Active task not found matching: ${args.title}` }
        if (name === 'completeTask') { tStore.toggleTask(found.id); return { success: true, message: `Completed task: ${found.title}` } }
        else { tStore.deleteTask(found.id); return { success: true, message: `Deleted task: ${found.title}` } }
    }
    if (name === 'createPage') {
        const id = pStore.createPage()
        const update = { title: args.title }
        if (args.content) update.content = [{ id: crypto.randomUUID(), type: 'p', text: args.content }]
        pStore.updatePage(id, update)
        return { success: true, message: `Created page: ${args.title}` }
    }
    if (name === 'addAssignment') {
        aStore.addAssignment({ title: args.title, subject: args.subject || '', dueDate: args.dueDate || new Date().toISOString().slice(0, 10), priority: args.priority || 'medium' })
        return { success: true, message: `Added assignment: ${args.title}` }
    }
    if (name === 'completeAssignment' || name === 'deleteAssignment') {
        const found = aStore.assignments.find(a => a.title.toLowerCase().includes(args.title.toLowerCase()))
        if (!found) return { success: false, error: `Assignment not found matching: ${args.title}` }
        if (name === 'completeAssignment') { aStore.updateAssignment(found.id, { status: 'submitted' }); return { success: true, message: `Completed assignment: ${found.title}` } }
        else { aStore.deleteAssignment(found.id); return { success: true, message: `Deleted assignment: ${found.title}` } }
    }
    if (name === 'addSubject') {
        aStore.addSubject(args.name, '#7c5cfc', args.targetPercentage || 80)
        return { success: true, message: `Added subject: ${args.name}` }
    }
    if (name === 'deleteSubject') {
        const s = aStore.subjects.find(sub => sub.name.toLowerCase().includes(args.name.toLowerCase()))
        if (!s) return { success: false, error: `Subject not found: ${args.name}` }
        aStore.removeSubject(s.id)
        return { success: true, message: `Deleted subject: ${s.name}` }
    }
    if (name === 'updateAttendance') {
        const s = aStore.subjects.find(s => s.name.toLowerCase().includes(args.subjectName.toLowerCase()))
        if (s) {
            aStore.updateSubject(s.id, { conducted: (s.conducted || 0) + (args.conductedToAdd || 0), attended: (s.attended || 0) + (args.attendedToAdd || 0) })
            return { success: true, message: `Updated attendance for ${s.name}: +${args.conductedToAdd} conducted, +${args.attendedToAdd} attended` }
        }
        return { success: false, error: `Subject ${args.subjectName} not found` }
    }
    if (name === 'updateTimetableSlot') {
        const s = aStore.subjects.find(sub => sub.name.toLowerCase().includes(args.subjectName.toLowerCase()))
        if (!s) return { success: false, error: `Subject ${args.subjectName} not found` }
        if (args.day < 1 || args.day > 6 || args.slot < 0 || args.slot > 4) return { success: false, error: `Invalid day/slot` }
        aStore.updateTimetableSlot(args.day, args.slot, s.id)
        return { success: true, message: `Updated timetable day ${args.day} slot ${args.slot}` }
    }
    if (name === 'updateSemester') {
        aStore.updateSemester({ startDate: args.startDate, endDate: args.endDate })
        return { success: true, message: `Updated semester dates to ${args.startDate} -> ${args.endDate}` }
    }
    return { success: false, error: "Unknown tool" }
}

/* ── Build rich system prompt from live app state ─────── */
function buildSystemPrompt() {
    const tasks   = useTaskStore.getState().tasks
    const streak  = useTaskStore.getState().streak
    const pages   = usePageStore.getState().pages
    const { subjects, assignments, semester, getSubjectStats } = useAcademicStore.getState()

    const activeTasks    = tasks.filter(t => !t.completed).map(t => `- ${t.title}`).join('\n') || 'None'
    const allPages       = pages.map(p => `- ${p.title || 'Untitled'}`).join('\n') || 'None'
    const pendingAssign  = assignments.filter(a => a.status !== 'submitted')
        .map(a => `- ${a.title} | ${a.subject} | Due: ${a.dueDate} | Priority: ${a.priority}`).join('\n') || 'None'
    
    const subjectList = subjects.map(s => {
        const stats = getSubjectStats(s.id)
        if (!stats) return `- ${s.name}`
        return `- ${s.name}: ${stats.currentPct}% attendance (target ${s.target}%)`
    }).join('\n') || 'None'
    
    const semInfo        = semester.startDate
        ? `${semester.startDate} → ${semester.endDate || 'not set'}`
        : 'Not configured'

    return `You are the MyNotion AI Assistant — an intelligent academic companion with FULL root access to the student's app.
You are powered by Cerebras inference (llama3.1-8b).

STUDENT'S CURRENT STATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Active Tasks:
${activeTasks}
🔥 Current Streak: ${streak?.current || 0} days

📄 Pages in Workspace:
${allPages}

📚 Subjects & Attendance:
${subjectList}

📝 Pending Assignments:
${pendingAssign}

🗓️ Semester Dates: ${semInfo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL GUIDELINES:
- **GOD MODE TOOLS**: You have full permission to add, delete, edit, or complete ANY task, assignment, subject, attendance log, or timetable slot.
- IF THE USER ASKS YOU TO CHANGE SOMETHING, ALWAYS ALWAYS USE THE APPROPRIATE TOOL function to execute it! Do not tell them how to do it manually. Do it for them.
- If you encounter an error (like "task not found"), politely let them know.
- Today's date is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}.`
}

/* ── Retry wrapper for 429 errors ─────────────────────── */
async function fetchWithRetry(url, options, maxRetries = 2) {
    for (let i = 0; i < maxRetries; i++) {
        const res = await fetch(url, options)
        if (res.status === 429) {
            console.warn(`Cerebras API 429 Rate Limit. Retrying in ${1000 * (i + 1)}ms...`)
            await new Promise(r => setTimeout(r, 1000 * (i + 1)))
            continue
        }
        return res
    }
    // Final attempt
    return fetch(url, options)
}

/* ── Non-streaming request (fallback) ─────────────────── */
export async function askCerebras(messages) {
    if (!API_KEY) throw new Error('Cerebras API key not set.')

    const res = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
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
        const errText = await res.text()
        if (res.status === 429) {
            throw new Error(`The free Cerebras API is currently overloaded with traffic (Queue Exceeded). Please wait a few seconds and try again!`)
        }
        throw new Error(`Cerebras API error ${res.status}: ${errText}`)
    }
    
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

    for (let loopCount = 0; loopCount < 5; loopCount++) {
        const res = await fetchWithRetry(`${BASE_URL}/chat/completions`, {
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

        if (!res.ok) {
            const errText = await res.text()
            if (res.status === 429) {
                throw new Error(`The free Cerebras API is currently overloaded with traffic (Queue Exceeded). Please wait a few seconds and try again!`)
            }
            throw new Error(`Cerebras API error ${res.status}: ${errText}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        
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
        
        // Handle models that output raw JSON in content instead of tool_calls array
        let rawToolCall = null;
        try {
            const text = loopContent.trim();
            if (text.startsWith('{') && text.includes('"function"') && text.includes('"name"')) {
                const parsed = JSON.parse(text);
                if (parsed.type === 'function' && parsed.name) {
                    rawToolCall = parsed;
                }
            }
        } catch (e) {}

        if (callsArray.length > 0 || rawToolCall) {
            // Erase the raw JSON from the UI if the model leaked it
            if (rawToolCall && totalContent.endsWith(loopContent)) {
                totalContent = totalContent.slice(0, totalContent.length - loopContent.length);
                onChunk(totalContent);
            }

            const toolCallsMsgArray = rawToolCall 
                ? [{ id: "call_" + Date.now(), type: 'function', function: { name: rawToolCall.name, arguments: JSON.stringify(rawToolCall.arguments || {}) } }]
                : callsArray.map(c => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.arguments } }))

            currentMessages.push({
                role: 'assistant',
                content: (rawToolCall ? null : loopContent) || null,
                tool_calls: toolCallsMsgArray
            })

            for (const tc of toolCallsMsgArray) {
                let args = {}
                try { args = JSON.parse(tc.function.arguments) } catch (e) {}
                console.log("Cerebras Tool Called:", tc.function.name, args)
                const result = executeTool(tc.function.name, args)
                
                currentMessages.push({
                    role: 'tool',
                    tool_call_id: tc.id,
                    name: tc.function.name,
                    content: JSON.stringify(result)
                })
            }

            continue
        } else {
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
