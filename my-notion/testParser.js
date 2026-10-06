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
            if (line.toUpperCase().includes('PHASE-1') || line.toUpperCase().includes('PHASE -1') || line.toUpperCase().includes('PHASE 1')) {
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

const mockText = `
19AI301 [3 Credits]
ENGINEERING SCIENCES - ENGINEERING SCIENCES ES
Course overview
Python Programming

UG - 04, PHASE-1, AI - AIDS & AIML
Date: 02-10-2026 to 02-10-2026
Monday: 17:20 - 17:21

UG - 04, T2-G31, AI - Mariya Monica Celestina A
Date: 08-10-2026 to 19-12-2026
Friday: 10:00 - 11:00
`;

const lines = mockText.split('\n').map(l => l.trim());
console.log(JSON.stringify(parseSecFormat(lines), null, 2));
