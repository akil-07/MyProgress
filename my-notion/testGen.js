import fs from 'fs';

function parseSecFormat(lines) {
    const subjectsMap = {};
    let currentSubject = null;
    let currentSection = null;
    let expectingName = false;

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const subMatch = line.match(/^([A-Z0-9]+)\s+\[(\d+)\s+Credits\]/i);
        if (subMatch) {
            currentSubject = {
                code: subMatch[1],
                name: 'Unknown',
                credits: parseInt(subMatch[2], 10),
                sections: []
            };
            subjectsMap[currentSubject.code] = currentSubject;
            currentSection = null;
            expectingName = true;
            continue;
        }

        if (expectingName && currentSubject) {
            if (line.toLowerCase() === 'course overview') continue;
            if (line.includes(' - ') && line === line.toUpperCase()) continue;
            currentSubject.name = line;
            expectingName = false;
            continue;
        }

        if (line.startsWith('UG -') || line.startsWith('PG -') || line.startsWith('SH -') || /^UG\s*-/.test(line)) {
            if (/PHASE\s*-?\s*1/i.test(line)) {
                currentSection = null;
                continue;
            }

            const parts = line.split(',');
            const secName = parts[1] ? parts[1].trim() : 'Unknown';
            let staff = 'Unknown';
            if (parts.length > 2) {
                const staffPart = parts[2].split('-');
                staff = staffPart.length > 1 ? staffPart.slice(1).join('-').trim() : parts[2].trim();
            }

            currentSection = {
                name: secName,
                staff: staff,
                slots: []
            };
            if (currentSubject) {
                currentSubject.sections.push(currentSection);
            }
            continue;
        }

        const matchedDay = daysOfWeek.find(d => line.startsWith(d + ':') || line.startsWith(d.substring(0,3) + ':'));
        if (matchedDay && currentSection) {
            const timesString = line.substring(line.indexOf(':') + 1).trim();
            const timePattern = /(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/g;
            let match;
            while ((match = timePattern.exec(timesString)) !== null) {
                currentSection.slots.push({
                    day: matchedDay.substring(0, 3).toUpperCase(),
                    time: `${match[1]}-${match[2]}`,
                    room: 'TBD'
                });
            }
        }
    }

    return Object.values(subjectsMap);
}

function timeToMins(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
}

function hasOverlap(slot1, slot2) {
    if (slot1.day !== slot2.day) return false;
    
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

function generateTimetables(selectedSubjects, preferences) {
    const { leaveDays, staffPrefs, timePref } = preferences;
    const leaveSet = new Set(leaveDays);

    const filteredSubjects = selectedSubjects.map(sub => {
        const validSections = sub.sections.filter(sec => {
            const hasLeaveDay = sec.slots.some(slot => leaveSet.has(slot.day));
            if (hasLeaveDay) return false;
            return true;
        });
        return { ...sub, validSections };
    });

    const combinations = [];
    let iters = 0;

    function search(depth, currentCombo) {
        iters++;
        if (iters % 10000 === 0) console.log(`Search depth ${depth}, iters ${iters}, current combos ${combinations.length}`);
        
        if (depth === filteredSubjects.length) {
            if (isCombinationValid(currentCombo)) {
                combinations.push([...currentCombo]);
            }
            return;
        }

        const sub = filteredSubjects[depth];
        if (!sub.validSections.length) return;

        for (const sec of sub.validSections) {
            const currentObj = { subject: sub, section: sec };
            if (isCombinationValid([...currentCombo, currentObj])) {
                currentCombo.push(currentObj);
                search(depth + 1, currentCombo);
                currentCombo.pop();
            }
        }
    }

    search(0, []);
    console.log(`Total iters: ${iters}`);
    return combinations;
}

const mockText = fs.readFileSync('pasted_text.txt', 'utf8');
const lines = mockText.split('\n').map(l => l.trim());
const subjects = parseSecFormat(lines);
console.log(`Parsed ${subjects.length} subjects.`);

const selectedCodes = ['19CS405', '19AI405', '19AI301', '19EY709'];
const selectedSubjects = subjects.filter(s => selectedCodes.includes(s.code));
console.log(`Selected ${selectedSubjects.length} subjects.`);

console.log('Generating timetables...');
const t1 = Date.now();
const combos = generateTimetables(selectedSubjects, { leaveDays: [], staffPrefs: {}, timePref: 'NO_PREF' });
const t2 = Date.now();
console.log(`Generated ${combos.length} combinations in ${t2 - t1}ms.`);
