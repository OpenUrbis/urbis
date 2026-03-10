import React, { useState, useEffect } from 'react';
import { Input } from '@open-urbis/map-ui';
import { parse, isValid } from 'date-fns';

interface DatePartsInputProps {
    value?: string;
    onChange: (value: string | undefined) => void;
    disabled?: boolean;
    maxYear?: number;
    allowFuture?: boolean;
    className?: string;
}

export function DatePartsInput({ value, onChange, disabled, maxYear, allowFuture, className }: DatePartsInputProps) {
    // Parse value (DD.MM.YYYY) into parts
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    useEffect(() => {
        if (value && value !== 'vigência condicionada') {
            const parts = value.split('.');
            if (parts.length === 3) {
                setDay(parts[0]);
                setMonth(parts[1]);
                setYear(parts[2]);
            }
        } else {
            setDay('');
            setMonth('');
            setYear('');
        }
    }, [value]);

    const handleChange = (d: string, m: string, y: string) => {
        setDay(d);
        setMonth(m);
        setYear(y);

        if (d && m && y && d.length > 0 && m.length > 0 && y.length === 4) {
            // Pad day and month
            const paddedDay = d.padStart(2, '0');
            const paddedMonth = m.padStart(2, '0');
            const dateStr = `${paddedDay}.${paddedMonth}.${y}`;
            
            // Validate date
            const date = parse(dateStr, 'dd.MM.yyyy', new Date());
            if (isValid(date)) {
                // Additional validations
                const yearNum = parseInt(y);
                if (maxYear && yearNum > maxYear) return; // Invalid year
                
                onChange(dateStr);
            } else {
                 // Invalid date format
            }
        } else if (!d && !m && !y) {
            onChange(undefined);
        }
    };

    return (
        <div className={`flex gap-2 items-center ${className || ''}`}>
            <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">DIA</span>
                <Input 
                    placeholder="DD" 
                    value={day} 
                    onChange={e => handleChange(e.target.value.slice(0, 2).replace(/\D/g, ''), month, year)}
                    className="w-12 text-center px-1" 
                    maxLength={2}
                    disabled={disabled}
                />
            </div>
            <span className="mt-5 text-muted-foreground">/</span>
            <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">MÊS</span>
                <Input 
                    placeholder="MM" 
                    value={month} 
                    onChange={e => handleChange(day, e.target.value.slice(0, 2).replace(/\D/g, ''), year)}
                    className="w-12 text-center px-1" 
                    maxLength={2}
                    disabled={disabled}
                />
            </div>
            <span className="mt-5 text-muted-foreground">/</span>
            <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground ml-1 mb-0.5">ANO</span>
                <Input 
                    placeholder="AAAA" 
                    value={year} 
                    onChange={e => handleChange(day, month, e.target.value.slice(0, 4).replace(/\D/g, ''))}
                    className="w-16 text-center px-1" 
                    maxLength={4}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}
