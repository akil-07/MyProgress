import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportTimetableToPDF(timetable, index, total) {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text(`Generated Timetable ${index + 1} of ${total}`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text('SEC Clash Planner - MyNotion', 14, 30);

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    // Let's create standard timeslots for the grid
    const timeslots = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    // Build the grid data
    const gridData = [];
    days.forEach(day => {
        const rowData = [day];
        timeslots.forEach(time => {
            // Find if any class falls in this hour
            let cellContent = '';
            timetable.forEach(({ subject, section }) => {
                section.slots.forEach(slot => {
                    if (slot.day === day && slot.time.startsWith(time)) {
                        cellContent = `${subject.code}\n${subject.name}\nSec: ${section.name}\n${section.staff}\nRoom: ${slot.room}`;
                    }
                });
            });
            rowData.push(cellContent);
        });
        gridData.push(rowData);
    });

    autoTable(doc, {
        startY: 40,
        head: [['Day', ...timeslots.map(t => `${t}\n-\n${parseInt(t)+1}:00`)]],
        body: gridData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3, valign: 'middle', halign: 'center' },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
        },
        margin: { top: 40 }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save(`timetable_option_${index + 1}.pdf`);
}

export function exportAllTimetables(timetables) {
    const doc = new jsPDF('landscape');
    
    timetables.forEach((timetable, index) => {
        if (index > 0) doc.addPage();

        doc.setFontSize(18);
        doc.text(`Generated Timetable ${index + 1} of ${timetables.length}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text('SEC Clash Planner - MyNotion', 14, 30);

        const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const timeslots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

        const gridData = [];
        days.forEach(day => {
            const rowData = [day];
            timeslots.forEach(time => {
                let cellContent = '';
                timetable.forEach(({ subject, section }) => {
                    section.slots.forEach(slot => {
                        if (slot.day === day && slot.time.startsWith(time)) {
                            cellContent = `${subject.code}\n${subject.name}\nSec: ${section.name}\n${section.staff}\nRoom: ${slot.room}`;
                        }
                    });
                });
                rowData.push(cellContent);
            });
            gridData.push(rowData);
        });

        autoTable(doc, {
            startY: 40,
            head: [['Day', ...timeslots.map(t => `${t}\n-\n${parseInt(t)+1}:00`)]],
            body: gridData,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, valign: 'middle', halign: 'center' },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            columnStyles: {
                0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
            },
            margin: { top: 40 }
        });
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    doc.save('all_timetables.pdf');
}
