import { create } from 'zustand'

const LS = (key) => ({ 
    load: () => { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } }, 
    save: (v) => localStorage.setItem(key, JSON.stringify(v)) 
})

const clashLS = LS('mynotion_clash_planner')

const defaultState = {
    step: 1,
    allSubjects: [],
    selectedSubjects: [],
    preferences: {
        leaveDays: [],
        staffPrefs: {},
        timePref: 'NO_PREF'
    },
    combinations: [],
    conflicts: [],
    isGenerating: false
}

const useClashStore = create((set, get) => ({
    ...defaultState,
    ...(clashLS.load() || {}),

    setStep: (step) => {
        set({ step })
        clashLS.save(getStoreData(get(), { step }))
    },
    
    setAllSubjects: (allSubjects) => {
        set({ allSubjects })
        clashLS.save(getStoreData(get(), { allSubjects }))
    },
    
    setSelectedSubjects: (selectedSubjects) => {
        set({ selectedSubjects })
        clashLS.save(getStoreData(get(), { selectedSubjects }))
    },
    
    setPreferences: (preferences) => {
        set({ preferences })
        clashLS.save(getStoreData(get(), { preferences }))
    },
    
    setCombinations: (combinations) => {
        set({ combinations })
        clashLS.save(getStoreData(get(), { combinations }))
    },
    
    setConflicts: (conflicts) => {
        set({ conflicts })
        clashLS.save(getStoreData(get(), { conflicts }))
    },
    
    setIsGenerating: (isGenerating) => {
        set({ isGenerating })
    },

    reset: () => {
        set({ ...defaultState })
        clashLS.save(defaultState)
    }
}))

function getStoreData(state, updates = {}) {
    const newState = { ...state, ...updates }
    return {
        step: newState.step,
        allSubjects: newState.allSubjects,
        selectedSubjects: newState.selectedSubjects,
        preferences: newState.preferences,
        combinations: newState.combinations,
        conflicts: newState.conflicts
    }
}

export default useClashStore
