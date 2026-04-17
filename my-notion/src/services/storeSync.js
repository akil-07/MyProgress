import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'
import usePageStore from '../store/pageStore.js'
import useTaskStore from '../store/taskStore.js'
import useAcademicStore from '../store/academicStore.js'
import useClashStore from '../store/clashStore.js'
import useMoodleStore from '../store/moodleStore.js'

let syncTimeout = null

export async function loadUserData(uid) {
    if (!db) return
    try {
        const docRef = doc(db, 'users', uid)
        const snap = await getDoc(docRef)

        if (snap.exists()) {
            const data = snap.data()
            if (data.pages) usePageStore.setState({ pages: data.pages })
            if (data.tasks) useTaskStore.setState({ tasks: data.tasks, streak: data.streak || useTaskStore.getState().streak })
            if (data.academic) {
                useAcademicStore.setState({
                    subjects: data.academic.subjects || [],
                    semester: data.academic.semester || {},
                    assignments: data.academic.assignments || [],
                    timetable: data.academic.timetable || useAcademicStore.getState().timetable,
                    timetableRooms: data.academic.timetableRooms || useAcademicStore.getState().timetableRooms,
                    absences: data.academic.absences || [],
                    hoursPerClass: data.academic.hoursPerClass || useAcademicStore.getState().hoursPerClass
                })
                
                // Keep local storage in sync as well
                try {
                    if (data.academic.subjects) localStorage.setItem('mynotion_subjects', JSON.stringify(data.academic.subjects))
                    if (data.academic.semester) localStorage.setItem('mynotion_semester', JSON.stringify(data.academic.semester))
                    if (data.academic.assignments) localStorage.setItem('mynotion_assignments', JSON.stringify(data.academic.assignments))
                    if (data.academic.timetable) localStorage.setItem('mynotion_timetable', JSON.stringify(data.academic.timetable))
                    if (data.academic.timetableRooms) localStorage.setItem('mynotion_timetableRooms', JSON.stringify(data.academic.timetableRooms))
                    if (data.academic.absences) localStorage.setItem('mynotion_absences', JSON.stringify(data.academic.absences))
                    if (data.academic.hoursPerClass) localStorage.setItem('mynotion_hpc', JSON.stringify(data.academic.hoursPerClass))
                } catch (e) {
                    // Ignore LS errors
                }
            }
            if (data.clashPlanner) {
                useClashStore.setState({
                    step: data.clashPlanner.step || 1,
                    allSubjects: data.clashPlanner.allSubjects || [],
                    selectedSubjects: data.clashPlanner.selectedSubjects || [],
                    preferences: data.clashPlanner.preferences || { leaveDays: [], staffPrefs: {}, timePref: 'NO_PREF' },
                    combinations: data.clashPlanner.combinations || [],
                    conflicts: data.clashPlanner.conflicts || []
                })
                
                try {
                    localStorage.setItem('mynotion_clash_planner', JSON.stringify(data.clashPlanner))
                } catch (e) {
                    // Ignore LS errors
                }
            }
            if (data.moodleToken) {
                useMoodleStore.setState({ token: data.moodleToken });
                try {
                    localStorage.setItem('mynotion_moodle_token', data.moodleToken);
                    
                    // Trigger a moodle sync if we have a token but no snapshot yet
                    const currentSnapshot = useMoodleStore.getState().snapshot;
                    if (!currentSnapshot) {
                        useMoodleStore.getState().syncMoodle(data.moodleToken).catch(console.error);
                    }
                } catch (e) {
                    // Ignore
                }
            }
        } else {
            // New user, save initial local state to firestore
            await saveUserData(uid)
        }
    } catch (e) {
        console.error("Failed to load user data from Firestore", e)
    }
}

export function saveUserData(uid) {
    if (!db || !uid) return

    const pages = usePageStore.getState().pages
    const { tasks, streak } = useTaskStore.getState()
    const academic = useAcademicStore.getState()
    const clash = useClashStore.getState()
    const moodleToken = useMoodleStore.getState().token

    const data = {
        pages,
        tasks,
        streak,
        moodleToken,
        academic: {
            subjects: academic.subjects,
            semester: academic.semester,
            assignments: academic.assignments,
            timetable: academic.timetable,
            timetableRooms: academic.timetableRooms,
            absences: academic.absences,
            hoursPerClass: academic.hoursPerClass
        },
        clashPlanner: {
            step: clash.step,
            allSubjects: clash.allSubjects,
            selectedSubjects: clash.selectedSubjects,
            preferences: clash.preferences,
            combinations: clash.combinations,
            conflicts: clash.conflicts
        },
        updatedAt: new Date().toISOString()
    }

    return setDoc(doc(db, 'users', uid), data, { merge: true }).catch(e => console.error("Failed to sync to Firestore", e))
}

export function setupSync(uid) {
    if (!uid) return () => { }

    // Subscribe to all stores
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
