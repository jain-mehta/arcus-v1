'use client';

import React from 'react';

export function HrmsAttendanceChart({ data }: { data?: Array<{ name: string; value: number }> }) {
    // Minimal placeholder chart to satisfy imports; can be replaced by real chart
    const chartData = data || [
        { name: 'Present', value: 75 },
        { name: 'Absent', value: 20 },
        { name: 'On Break', value: 5 },
    ];

    return (
        <div className="border rounded-md p-4 bg-muted/50">
            <div className="text-sm font-medium mb-2">Attendance Summary</div>
            <ul className="text-sm grid grid-cols-3 gap-2">
                {chartData.map((d) => (
                    <li key={d.name} className="flex items-center justify-between bg-background px-3 py-2 rounded">
                        <span>{d.name}</span>
                        <span className="font-semibold">{d.value}%</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}



