"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const streakService_1 = require("../../src/services/streakService");
// Helper: fecha relativa a hoy en formato YYYY-MM-DD
const d = (daysAgo) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
};
const today = d(0);
describe('calculateStreak', () => {
    it('retorna 0 con arreglo vacío', () => {
        expect((0, streakService_1.calculateStreak)([])).toBe(0);
    });
    it('retorna 1 si solo se completó hoy', () => {
        expect((0, streakService_1.calculateStreak)([today])).toBe(1);
    });
    it('retorna 1 si solo se completó ayer', () => {
        expect((0, streakService_1.calculateStreak)([d(1)])).toBe(1);
    });
    it('retorna 0 si la última completación fue hace 2 o más días', () => {
        expect((0, streakService_1.calculateStreak)([d(2)])).toBe(0);
    });
    it('retorna la racha correcta con días consecutivos incluyendo hoy', () => {
        expect((0, streakService_1.calculateStreak)([today, d(1), d(2)])).toBe(3);
    });
    it('corta la racha al encontrar un hueco', () => {
        expect((0, streakService_1.calculateStreak)([today, d(1), d(3)])).toBe(2);
    });
    it('calcula racha desde ayer cuando hoy no está completado', () => {
        expect((0, streakService_1.calculateStreak)([d(1), d(2), d(3)])).toBe(3);
    });
    it('maneja fechas duplicadas sin contar doble', () => {
        expect((0, streakService_1.calculateStreak)([today, today, d(1)])).toBe(2);
    });
});
describe('calculateMaxStreak', () => {
    it('retorna 0 con arreglo vacío', () => {
        expect((0, streakService_1.calculateMaxStreak)([])).toBe(0);
    });
    it('retorna 1 con una sola completación', () => {
        expect((0, streakService_1.calculateMaxStreak)(['2026-05-01'])).toBe(1);
    });
    it('retorna la racha más larga entre varias rachas', () => {
        const dates = ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-05', '2026-05-06'];
        expect((0, streakService_1.calculateMaxStreak)(dates)).toBe(3);
    });
    it('retorna el total cuando todos los días son consecutivos', () => {
        const dates = ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04'];
        expect((0, streakService_1.calculateMaxStreak)(dates)).toBe(4);
    });
});
describe('calculateCoins', () => {
    it('retorna 10 base sin bonus para racha no múltiplo de 7', () => {
        expect((0, streakService_1.calculateCoins)(1)).toEqual({ base: 10, bonus: 0, total: 10 });
    });
    it('retorna 10 base + 25 bonus para racha 7', () => {
        expect((0, streakService_1.calculateCoins)(7)).toEqual({ base: 10, bonus: 25, total: 35 });
    });
    it('retorna bonus también para racha 14', () => {
        expect((0, streakService_1.calculateCoins)(14)).toEqual({ base: 10, bonus: 25, total: 35 });
    });
    it('no da bonus para racha 0', () => {
        expect((0, streakService_1.calculateCoins)(0)).toEqual({ base: 10, bonus: 0, total: 10 });
    });
    it('no da bonus para racha 6', () => {
        expect((0, streakService_1.calculateCoins)(6)).toEqual({ base: 10, bonus: 0, total: 10 });
    });
});
//# sourceMappingURL=streakService.test.js.map