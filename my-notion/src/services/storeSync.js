import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import usePageStore from '../store/pageStore.js'
import useTaskStore from '../store/taskStore.js'
import useAcademicStore from '../store/academicStore.js'
import useClashStore from '../store/clashStore.js'
import useMoodleStore from '../store/moodleStore.js'

let syncTimeout = null

// ── Guard: prevent saving to Firebase BEFORE initial load completes ──────────
// This prevents a race condition where setupSync fires before loadUserData
// finishes and overwrites Firebase data with empty local store state.
let _dataLoaded = false

export function isDataLoaded() { return _dataLoaded }

export async function loadUserData(uid) {
    if (!db) {
        console.warn('[storeSync] Firestore not initialized — skipping load.')
        return
    }
    _dataLoaded = false
    try {
        console.log('[storeSync] Loading user data for uid:', uid)
        const docRef = doc(db, 'users', uid)
        const snap = await getDoc(docRef)

        if (snap.exists()) {
            const data = snap.data()
            console.log('[storeSync] Firebase data loaded:', {
                hasPages: !!data.pages,
                hasTasks: !!data.tasks,
                hasAcademic: !!data.academic,
                subjectsCount: data.academic?.subjects?.length ?? 0,
                hasTimetable: !!data.academic?.timetable
            })

            if (data.pages) usePageStore.setState({ pages: data.pages })

            if (data.tasks) {
                useTaskStore.setState({
                    tasks: data.tasks,
                    streak: data.streak || useTaskStore.getState().streak
                })
            }

            if (data.academic) {
                const ac = data.academic
                useAcademicStore.setState({
                    subjects:       ac.subjects      ?? useAcademicStore.getState().subjects,
                    semester:       ac.semester      ?? useAcademicStore.getState().semester,
                    assignments:    ac.assignments   ?? useAcademicStore.getState().assignments,
                    timetable:      ac.timetable     ?? useAcademicStore.getState().timetable,
                    timetableRooms: ac.timetableRooms ?? useAcademicStore.getState().timetableRooms,
                    absences:       ac.absences      ?? useAcademicStore.getState().absences,
                    hoursPerClass:  ac.hoursPerClass ?? useAcademicStore.getState().hoursPerClass,
                })

                // Keep local storage in sync (removed per user request - use only Firebase)
            }

            if (data.clashPlanner) {
                useClashStore.setState({
                    step:             data.clashPlanner.step             || 1,
                    allSubjects:      data.clashPlanner.allSubjects      || [],
                    selectedSubjects: data.clashPlanner.selectedSubjects || [],
                    preferences:      data.clashPlanner.preferences      || { leaveDays: [], staffPrefs: {}, timePref: 'NO_PREF' },
                    combinations:     data.clashPlanner.combinations     || [],
                    conflicts:        data.clashPlanner.conflicts         || [],
                })
                // localStorage.setItem('mynotion_clash_planner', ...) removed
            }

            if (data.moodleToken) {
                useMoodleStore.setState({ token: data.moodleToken })
                try {
                    const currentSnapshot = useMoodleStore.getState().snapshot
                    if (!currentSnapshot) {
                        useMoodleStore.getState().syncMoodle(data.moodleToken).catch(console.error)
                    }
                } catch (e) { /* ignore */ }
            }

        } else {
            // New user — save initial local state to Firestore
            console.log('[storeSync] No Firebase data found for user — saving initial state.')
            await saveUserData(uid, true)
        }

        _dataLoaded = true
        console.log('[storeSync] ✅ Data load complete.')

    } catch (e) {
        console.error('[storeSync] ❌ Failed to load user data from Firestore:', e)
        // Still mark as loaded so the app doesn't stay blocked
        _dataLoaded = true
        // Surface the error so users know something went wrong
        throw e
    }
}

export function saveUserData(uid, force = false) {
    if (!db || !uid) return
    // ── Guard: don't overwrite Firebase with empty local state during initial load ──
    if (!force && !_dataLoaded) {
        console.warn('[storeSync] Skipping save — initial Firebase load not complete yet.')
        return
    }

    const pages      = usePageStore.getState().pages
    const { tasks, streak } = useTaskStore.getState()
    const academic   = useAcademicStore.getState()
    const clash      = useClashStore.getState()
    const moodleToken = useMoodleStore.getState().token

    const data = {
        pages,
        tasks,
        streak,
        moodleToken,
        academic: {
            subjects:       academic.subjects,
            semester:       academic.semester,
            assignments:    academic.assignments,
            timetable:      academic.timetable,
            timetableRooms: academic.timetableRooms,
            absences:       academic.absences,
            hoursPerClass:  academic.hoursPerClass,
        },
        clashPlanner: {
            step:             clash.step,
            allSubjects:      clash.allSubjects,
            selectedSubjects: clash.selectedSubjects,
            preferences:      clash.preferences,
            combinations:     clash.combinations,
            conflicts:        clash.conflicts,
        },
        updatedAt: new Date().toISOString(),
    }

    return setDoc(doc(db, 'users', uid), data, { merge: true })
        .catch(e => console.error('[storeSync] ❌ Failed to sync to Firestore:', e))
}

export function setupSync(uid) {
    if (!uid) return () => {}

    const unsubs = [usePageStore, useTaskStore, useAcademicStore, useClashStore, useMoodleStore].map(store =>
        store.subscribe(() => {
            clearTimeout(syncTimeout)
            syncTimeout = setTimeout(() => saveUserData(uid), 1500)
        })
    )

    return () => {
        unsubs.forEach(u => u())
        clearTimeout(syncTimeout)
    }
}
