import { create } from 'zustand'

// ── helpers ──────────────────────────────────────────────
const LS_KEY = 'mynotion_pages'

function loadPages() {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY)) || []
    } catch {
        return []
    }
}

function savePages(pages) {
    localStorage.setItem(LS_KEY, JSON.stringify(pages))
}

function makeId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── store ─────────────────────────────────────────────────
const usePageStore = create((set, get) => ({
    pages: loadPages(),
    activePageId: null,

    createPage: (parentId = null) => {
        const { pages } = get()
        const newPage = {
            id: makeId(),
            title: 'Untitled',
            icon: '📄',
            content: null,
            parentId: parentId || null,
            order: pages.filter(p => p.parentId === parentId).length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        const updated = [...pages, newPage]
        savePages(updated)
        set({ pages: updated, activePageId: newPage.id })
        return newPage.id
    },

    updatePage: (pageId, data) => {
        const { pages } = get()
        const updated = pages.map(p =>
            p.id === pageId
                ? { ...p, ...data, updatedAt: new Date().toISOString() }
                : p
        )
        savePages(updated)
        set({ pages: updated })
    },

    deletePage: (pageId) => {
        const { pages, activePageId } = get()

        // collect all descendant ids
        const toDelete = new Set()
        const collect = (id) => {
            toDelete.add(id)
            pages.filter(p => p.parentId === id).forEach(c => collect(c.id))
        }
        collect(pageId)

        const updated = pages.filter(p => !toDelete.has(p.id))
        savePages(updated)
        set({
            pages: updated,
            activePageId: toDelete.has(activePageId) ? null : activePageId,
        })
    },

    setActivePage: (pageId) => set({ activePageId: pageId }),
}))

export default usePageStore
