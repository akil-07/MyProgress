import * as pdfjsLib from 'pdfjs-dist';

// Use local worker or unpkg for Vite compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Join with newlines to preserve some vertical structure where possible
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }
    
    return fullText;
}

export function parseTextToSubjects(text) {
    if (!text || text.trim() === '') return [];

    // Fallback Mock System if "demo" is detected
    if (text.toLowerCase().includes('demo mode')) {
        return getMockData();
    }

    const lines = text.split('\n').map(l => l.trim());
    
    // First, let's detect if it's the SEC Raw Format
    // SEC format will have lines like "19AI305 [3 Credits]"
    const isSecFormat = lines.some(l => /^[A-Z0-9]+\s+\[\d+\s+Credits\]/i.test(l));

    if (isSecFormat) {
        return parseSecFormat(lines);
    }
    
    // Fallback to pipe/tab parser if not SEC format
    return parseTabularFormat(lines);
}

function parseSecFormat(lines) {
    const subjectsMap = {};
    let currentSubject = null;
    let currentSection = null;
    let expectingName = false;

    // Helper days map
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        // 1. Detect new subject
        const subMatch = line.match(/^([A-Z0-9]+)\s+\[(\d+)\s+Credits\]/i);
        if (subMatch) {
            currentSubject = {
                code: subMatch[1],
                name: 'Unknown',
                credits: parseInt(subMatch[2], 10),
                sections: []
            };
            subjectsMap[currentSubject.code] = currentSubject;
            currentSection = null; // reset section
            expectingName = true;
            continue;
        }

        // 2. State: Expecting Name
        if (expectingName && currentSubject) {
            if (line.toLowerCase() === 'course overview') {
                continue; // The next line is usually the actual course name
            }
            if (line.includes(' - ') && line === line.toUpperCase()) {
                continue; // Skip category line like "ENGINEERING SCIENCES - ENGINEERING SCIENCES"
            }
            // If it made it here, it's likely the title!
            currentSubject.name = line;
            expectingName = false;
            continue;
        }

        // 3. Detect new section
        if (line.startsWith('UG -') || line.startsWith('PG -') || line.startsWith('SH -') || /^UG\s*-/.test(line)) {
            // Example: "UG - 04, T2-G18, AI - Xavier Retin"
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

        // 4. Detect Day/Time slots
        const matchedDay = daysOfWeek.find(d => line.startsWith(d + ':') || line.startsWith(d.substring(0,3) + ':'));
        if (matchedDay && currentSection) {
            // Monday: 13:00 - 14:0014:00 - 15:00
            const timesString = line.substring(line.indexOf(':') + 1).trim();
            // find all patterns like 13:00 - 14:00
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

function parseTabularFormat(lines) {
    const subjectsMap = {};
    for (const line of lines) {
        if (!line) continue;
        const parts = line.split(/\||\t/).map(s => s.trim());
        if (parts.length >= 7) {
            const [code, name, credits, secName, staff, daysStr, time, room] = parts;
            if (!subjectsMap[code]) {
                subjectsMap[code] = { code, name, credits: parseInt(credits) || 3, sections: [] };
            }
            const days = daysStr.split(',').map(d => d.trim().substring(0, 3).toUpperCase());
            const slots = days.map(day => ({ day, time: time || '09:00-10:00', room: room || 'TBD' }));
            subjectsMap[code].sections.push({ name: secName, staff: staff, slots });
        }
    }
    const subjectsArray = Object.values(subjectsMap);
    if (subjectsArray.length === 0) {
        console.warn('Could not parse tabular format. Returning demo data.');
        return getMockData();
    }
    return subjectsArray;
}
function getMockData() {
    return [
        {
            code: '21CSB26',
            name: 'Operating Systems',
            credits: 3,
            sections: [
                {
                    name: 'A', staff: 'Dr. John', slots: [
                        { day: 'MON', time: '09:00-11:00', room: 'B-201' },
                        { day: 'WED', time: '10:00-12:00', room: 'B-201' }
                    ]
                },
                {
                    name: 'B', staff: 'Dr. Mary', slots: [
                        { day: 'TUE', time: '08:00-10:00', room: 'C-104' },
                        { day: 'THU', time: '13:00-15:00', room: 'C-104' }
                    ]
                }
            ]
        },
        {
            code: '21MAA04',
            name: 'Linear Algebra',
            credits: 4,
            sections: [
                {
                    name: 'A', staff: 'Prof. Smith', slots: [
                        { day: 'MON', time: '13:00-15:00', room: 'A-101' },
                        { day: 'FRI', time: '09:00-11:00', room: 'A-101' }
                    ]
                },
                {
                    name: 'B', staff: 'Prof. Smith', slots: [
                        { day: 'WED', time: '08:00-10:00', room: 'A-101' },
                        { day: 'THU', time: '08:00-10:00', room: 'A-101' }
                    ]
                }
            ]
        },
        {
            code: '21ECE12',
            name: 'Digital Logic',
            credits: 3,
            sections: [
                {
                    name: 'X', staff: 'Sarah Connor', slots: [
                        { day: 'TUE', time: '10:00-12:00', room: 'L-01' },
                        { day: 'FRI', time: '13:00-15:00', room: 'L-01' }
                    ]
                }
            ]
        }
    ];
}
