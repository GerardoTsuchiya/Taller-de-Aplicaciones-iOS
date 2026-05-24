import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import PixelText from './PixelText';
import { Colors } from '@/constants/theme';

function pad(n: number) { return String(n).padStart(2, '0'); }
function iso(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }

export default function MonthCalendar({
    year,
    month,
    completionsSet,
    todayIso,
    onPrev,
    onNext,
    onDayPress,
}: {
    year: number;
    month: number; // 1..12
    completionsSet: Set<string>;
    todayIso?: string;
    onPrev: () => void;
    onNext: () => void;
    onDayPress?: (isoDate: string) => void;
}) {
    const first = new Date(Date.UTC(year, month - 1, 1));
    const startDay = first.getUTCDay(); // 0..6 Sun..Sat
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const rows: number[][] = [];
    let cells: number[] = [];
    // fill leading blanks as 0
    for (let i = 0; i < startDay; i++) cells.push(0);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(d);
        if (cells.length === 7) { rows.push(cells); cells = []; }
    }
    while (cells.length < 7 && cells.length > 0) cells.push(0);
    if (cells.length) rows.push(cells);
    while (rows.length < 6) rows.push(Array(7).fill(0));

    const dayNames = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={onPrev} style={styles.navButton} activeOpacity={0.8} hitSlop={8}>
                    <PixelText size={12} color={Colors.gold}>◄</PixelText>
                </TouchableOpacity>
                <PixelText size={10} color={Colors.textSecondary} style={styles.monthLabel}>{`${year} - ${pad(month)}`}</PixelText>
                <TouchableOpacity onPress={onNext} style={styles.navButton} activeOpacity={0.8} hitSlop={8}>
                    <PixelText size={12} color={Colors.gold}>►</PixelText>
                </TouchableOpacity>
            </View>

            <View style={styles.weekNames}>
                {dayNames.map((dn) => <PixelText key={dn} size={8} color={Colors.textSecondary} style={styles.weekName}>{dn}</PixelText>)}
            </View>

            {rows.map((week, i) => (
                <View key={i} style={styles.weekRow}>
                    {week.map((d, j) => {
                        if (d === 0) return <View key={j} style={styles.dayCell} />;
                        const isoDate = iso(year, month, d);
                        const done = completionsSet.has(isoDate);
                        const isToday = todayIso === isoDate;
                        return (
                            <TouchableOpacity
                                key={j}
                                style={[styles.dayCell, isToday && styles.todayCell]}
                                onPress={() => onDayPress?.(isoDate)}
                                activeOpacity={0.7}
                            >
                                <PixelText
                                    size={9}
                                    color={done ? '#4ade80' : isToday ? Colors.gold : Colors.textMain}
                                    glow={done ? 'green' : isToday ? 'gold' : 'none'}
                                >
                                    {d}
                                </PixelText>
                                {done && <View style={styles.dot} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: '#07070b' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    navButton: {
        minWidth: 34,
        minHeight: 34,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3b3b59',
        backgroundColor: '#121224',
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthLabel: { flex: 1, textAlign: 'center' },
    weekNames: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    weekName: { width: `${100 / 7}%`, textAlign: 'center' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    dayCell: { width: `${100 / 7}%`, alignItems: 'center', minHeight: 24, justifyContent: 'center' },
    todayCell: {
        borderWidth: 1,
        borderColor: Colors.gold,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 2,
        backgroundColor: '#4ade80',
    },
});