// timetableGenerator.js

function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
}

function hasOverlap(slot1, slot2) {
    if (slot1.day !== slot2.day) return false;
    
    // Some formats could just be "09:00" or missing. Fallback to 1 hr slot.
    let s1Str = slot1.time, e1Str = '';
    let s2Str = slot2.time, e2Str = '';

    if (s1Str.includes('-')) {
        [s1Str, e1Str] = s1Str.split('-');
    } else {
        e1Str = `${parseInt(s1Str) + 1}:00`; 
    }

    if (s2Str.includes('-')) {
        [s2Str, e2Str] = s2Str.split('-');
    } else {
        e2Str = `${parseInt(s2Str) + 1}:00`; 
    }

    const s1 = timeToMins(s1Str), e1 = timeToMins(e1Str);
    const s2 = timeToMins(s2Str), e2 = timeToMins(e2Str);
    
    // strict less than for overlap so that 10:00-11:00 and 11:00-12:00 don't overlap
    return Math.max(s1, s2) < Math.min(e1, e2);
}

function isCombinationValid(combo) {
    const allSlots = combo.flatMap(c => c.section.slots);
    for (let i = 0; i < allSlots.length; i++) {
        for (let j = i + 1; j < allSlots.length; j++) {
            if (hasOverlap(allSlots[i], allSlots[j])) {
                return false;
            }
        }
    }
    return true;
}

export function detectInitialConflicts(selectedSubjects, leaveDays) {
    const leaveSet = new Set(leaveDays);
    const conflicts = [];

    for (const sub of selectedSubjects) {
        let allSectionsFallOnLeaveDays = true;
        
        for (const sec of sub.sections) {
            let sectionOnLeave = false;
            for (const slot of sec.slots) {
                if (leaveSet.has(slot.day)) {
                    sectionOnLeave = true;
                    break;
                }
            }
            if (!sectionOnLeave) {
                allSectionsFallOnLeaveDays = false;
                break;
            }
        }

        if (allSectionsFallOnLeaveDays) {
            conflicts.push(sub.name);
        }
    }
    return conflicts;
}

export function generateTimetables(selectedSubjects, preferences) {
    const { leaveDays, staffPrefs, timePref } = preferences;
    const leaveSet = new Set(leaveDays);

    const filteredSubjects = selectedSubjects.map(sub => {
        let validSections = sub.sections.filter(sec => {
            // Check leave days
            const hasLeaveDay = sec.slots.some(slot => leaveSet.has(slot.day));
            if (hasLeaveDay) return false;
            return true;
        });

        // Strict Staff Filtering:
        // If the user selected a preferred staff, we only keep sections with that staff.
        if (staffPrefs && staffPrefs[sub.code] && staffPrefs[sub.code] !== 'NO_PREF') {
            const prefStaffSections = validSections.filter(sec => sec.staff === staffPrefs[sub.code]);
            // If filtering leaves us with valid options, apply the filter.
            if (prefStaffSections.length > 0) {
                validSections = prefStaffSections;
            }
        }

        return { ...sub, validSections };
    });

    // Backtracking to find combinations
    const combinations = [];

    function search(depth, currentCombo) {
        if (depth === filteredSubjects.length) {
            if (isCombinationValid(currentCombo)) {
                combinations.push([...currentCombo]);
            }
            return;
        }

        const sub = filteredSubjects[depth];
        if (!sub.validSections.length) {
            // No valid sections for this subject -> immediately fails this path
            return;
        }

        for (const sec of sub.validSections) {
            const minimalSub = { code: sub.code, name: sub.name, credits: sub.credits };
            const currentObj = { subject: minimalSub, section: sec };
            
            // Check overlap with existing before going deeper to optimize
            if (isCombinationValid([...currentCombo, currentObj])) {
                currentCombo.push(currentObj);
                search(depth + 1, currentCombo);
                currentCombo.pop();
            }
        }
    }

    search(0, []);

    // 2. Score & Sort Combinations BEFORE capping
    const evalScore = (combo) => {
        let s = 0;
        combo.forEach(({ subject, section }) => {
            // Staff preference check (in case strict filter didn't apply due to conflicts)
            if (staffPrefs && staffPrefs[subject.code] === section.staff) {
                s += 10;
            }
            
            // Time preference check
            if (timePref && timePref !== 'NO_PREF') {
                const isMor = section.slots.every(sl => timeToMins(sl.time.split('-')[0]) < 12 * 60);
                const isAft = section.slots.every(sl => {
                    const mins = timeToMins(sl.time.split('-')[0]);
                    return mins >= 12 * 60 && mins < 16 * 60;
                });
                const isEve = section.slots.every(sl => timeToMins(sl.time.split('-')[0]) >= 16 * 60);
                
                if (timePref === 'MORNING' && isMor) s += 5;
                if (timePref === 'AFTERNOON' && isAft) s += 5;
                if (timePref === 'EVENING' && isEve) s += 5;
            }
        });
        return s;
    };

    // Calculate score once per combination to speed up sorting
    const scoredCombinations = combinations.map(combo => ({
        combo,
        score: evalScore(combo)
    }));

    scoredCombinations.sort((a, b) => b.score - a.score);

    // 3. Cap combinations to prevent localStorage QuotaExceededError and UI freezing
    const sortedCombinations = scoredCombinations.map(sc => sc.combo);
    const cappedCombinations = sortedCombinations.length > 500 ? sortedCombinations.slice(0, 500) : sortedCombinations;

    return cappedCombinations;
}
