import { GoogleGenerativeAI } from '@google/generative-ai';
import useTaskStore from '../store/taskStore.js';
import usePageStore from '../store/pageStore.js';
import useAcademicStore from '../store/academicStore.js';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const isGeminiConfigured = !!apiKey;
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// ==========================================
// TOOL / FUNCTION DEFINITIONS FOR GEMINI
// ==========================================
const tools = [{
    functionDeclarations: [
        {
            name: "addTask",
            description: "Add a task to the Streaks & Tasks list.",
            parameters: { type: "OBJECT", properties: { title: { type: "STRING" } }, required: ["title"] }
        },
        {
            name: "completeTask",
            description: "Mark a task in the Streaks & Tasks list as completed by searching for its title.",
            parameters: { type: "OBJECT", properties: { title: { type: "STRING" } }, required: ["title"] }
        },
        {
            name: "createPage",
            description: "Create a new document page in the workspace.",
            parameters: { type: "OBJECT", properties: { title: { type: "STRING" }, content: { type: "STRING", description: "Optional content paragraph for the page" } }, required: ["title"] }
        },
        {
            name: "addAssignment",
            description: "Add an academic assignment.",
            parameters: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING" },
                    subject: { type: "STRING" },
                    dueDate: { type: "STRING", description: "YYYY-MM-DD" },
                    priority: { type: "STRING", description: "high, medium, or low" }
                },
                required: ["title"]
            }
        },
        {
            name: "editPage",
            description: "Add or edit content of an existing page.",
            parameters: {
                type: "OBJECT",
                properties: {
                    title: { type: "STRING", description: "The title of the page to edit" },
                    content: { type: "STRING", description: "The content paragraph to add to the page" }
                },
                required: ["title", "content"]
            }
        }
    ]
}];

function executeTool(name, args) {
    if (name === 'addTask') {
        useTaskStore.getState().addTask(args.title, 'General');
        return { success: true, message: `Added task: ${args.title}` };
    }
    if (name === 'completeTask') {
        const { tasks, toggleTask } = useTaskStore.getState();
        const found = tasks.find(t => t.title.toLowerCase().includes(args.title.toLowerCase()) && !t.completed);
        if (found) {
            toggleTask(found.id);
            return { success: true, message: `Completed task: ${found.title}` };
        }
        return { success: false, error: `Could not find an active task matching: ${args.title}` };
    }
    if (name === 'createPage') {
        const state = usePageStore.getState();
        const id = state.createPage();
        const pageUpdate = { title: args.title };
        if (args.content) {
            // MyNotion uses an array of blocks for content
            pageUpdate.content = [{ id: crypto.randomUUID(), type: 'p', text: args.content }];
        }
        state.updatePage(id, pageUpdate);
        return { success: true, message: `Created new page: ${args.title}` };
    }
    if (name === 'addAssignment') {
        useAcademicStore.getState().addAssignment({
            title: args.title,
            subject: args.subject || '',
            dueDate: args.dueDate || new Date().toISOString().slice(0, 10),
            priority: args.priority || 'medium'
        });
        return { success: true, message: `Added assignment: ${args.title}` };
    }

    if (name === 'editPage') {
        const state = usePageStore.getState();
        const foundPage = state.pages.find(p => p.title.toLowerCase().includes(args.title.toLowerCase()));
        if (foundPage) {
            const currentContent = foundPage.content || [];
            const newBlock = { id: crypto.randomUUID(), type: 'p', text: args.content };
            state.updatePage(foundPage.id, { content: [...currentContent, newBlock] });
            return { success: true, message: `Added content to page: ${foundPage.title}` };
        }
        return { success: false, error: `Could not find an existing page matching: ${args.title}` };
    }

    return { success: false, error: "Unknown tool" };
}

// ==========================================
// EXPORTED FUNCTIONS
// ==========================================

export async function askGeminiChat(messages) {
    if (!genAI) throw new Error("Gemini API key is missing.");

    // Build the dynamic system instruction based on current state
    const tasks = useTaskStore.getState().tasks;
    const pages = usePageStore.getState().pages;
    const assign = useAcademicStore.getState().assignments;

    const activeTasks = tasks.filter(t => !t.completed).map(t => `- ${t.title}`).join('\n') || 'None';
    const allPages = pages.map(p => `- ${p.title}`).join('\n') || 'None';
    const assignmentsStr = assign.filter(a => a.status !== 'submitted').map(a => `- ${a.title} (${a.priority}) Due: ${a.dueDate}`).join('\n') || 'None';

    const systemInstruction =
        `You are the MyNotion AI Assistant. You have full access to the user's workspace, tasks, and academic assignments. ` +
        `You can help manage their life by calling functions to modify the app state directly.\n\n` +
        `CURRENT STATE FOR CONTEXT:\n` +
        `Active Tasks / To-Do:\n${activeTasks}\n\n` +
        `Pages:\n${allPages}\n\n` +
        `Pending Assignments:\n${assignmentsStr}\n\n` +
        `If the user asks you to check off a task, add a task, create a page, write content parameters while creating a page, or add to an existing page (via editPage) ALWAYS call the corresponding tool/function. Do NOT just say you did it. Actually call the function. After calling a function, confirm the action cleanly with the user.`;

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction,
        tools
    });

    const geminiHistory = [];
    messages.slice(0, -1).forEach(m => {
        const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
        // Skip any leading model messages (like the greeting)
        if (geminiHistory.length === 0 && role === 'model') return;

        // Merge consecutive messages of the same role (Gemini requires alternating roles)
        if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === role) {
            geminiHistory[geminiHistory.length - 1].parts[0].text += '\n\n' + m.content;
        } else {
            geminiHistory.push({ role, parts: [{ text: m.content }] });
        }
    });

    const lastMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history: geminiHistory });

    let result = await chat.sendMessage(lastMessage);
    let calls = result.response.functionCalls && result.response.functionCalls();

    // Limit function loops to prevent infinite error loops
    let loopCount = 0;
    while (calls && calls.length > 0 && loopCount < 5) {
        loopCount++;
        const call = calls[0]; // grab the first function call
        console.log("Agent called function:", call.name, call.args);

        const functionResult = executeTool(call.name, call.args);

        result = await chat.sendMessage([{
            functionResponse: {
                name: call.name,
                response: functionResult
            }
        }]);
        calls = result.response.functionCalls && result.response.functionCalls();
    }

    return result.response.text();
}

// Keeping the older ones intact for the document Slash editor features
export async function askGemini(prompt) {
    if (!genAI) throw new Error("Gemini API key is missing.");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function continueDocWriting(context) {
    if (!genAI) throw new Error("Gemini API key is missing.");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Given the following document text, continue writing the next paragraph that naturally flows from it. Do not include introductory text, just provide the continuation.\n\nContext:\n${context}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

export async function summarizeDocText(text) {
    if (!genAI) throw new Error("Gemini API key is missing.");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Please summarize the following text concisely:\n\n${text}\n\nSummary:`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}
