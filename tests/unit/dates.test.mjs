// The planner's calendar logic. No DOM, so node runs it directly.
//
// Every expectation here is a calendar fact checked away from this code, not a
// value read back out of it: an assertion generated from the implementation
// only pins the current behaviour in place, bug and all. The ISO week cases are
// the year boundaries, where a week belongs to the year holding its Thursday
// and the answer disagrees with the date's own year.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isoWeek, firstDayOf, weekDates, sameDay, dayParts,
  stampCells, stampLabel, stampLayout, cellKey, fillKey,
} from '../../src/js/dates.js';

const d = (y, m, day) => new Date(y, m - 1, day);

describe('isoWeek', () => {
  test('a January date can belong to the year before', () => {
    // 1 Jan 2021 is a Friday; its week holds no Thursday of 2021, so it is 2020's 53rd
    assert.equal(isoWeek(d(2021, 1, 1)), 53);
    // 1 Jan 2023 is a Sunday, the tail of the week beginning Mon 26 Dec 2022
    assert.equal(isoWeek(d(2023, 1, 1)), 52);
  });
  test('a December date can belong to the year after', () => {
    // Mon 30 Dec 2024 starts the week holding Thu 2 Jan 2025, the first Thursday of 2025
    assert.equal(isoWeek(d(2024, 12, 30)), 1);
  });
  test('a year beginning on a Thursday starts in week 1', () => {
    assert.equal(isoWeek(d(2026, 1, 1)), 1);   // 1 Jan 2026 is a Thursday
    assert.equal(isoWeek(d(2026, 1, 5)), 2);   // the Monday after
  });
  test('a year beginning on a Thursday has 53 weeks', () => {
    assert.equal(isoWeek(d(2026, 12, 31)), 53);
  });
  test('the time of day does not change the week', () => {
    const morning = new Date(2026, 5, 15, 0, 1);
    const night = new Date(2026, 5, 15, 23, 59);
    assert.equal(isoWeek(morning), isoWeek(night));
  });
});

describe('firstDayOf', () => {
  test('reads the locale, Sunday reported as 0 rather than 7', () => {
    assert.equal(firstDayOf('en-US'), 0);
    assert.equal(firstDayOf('en-GB'), 1);
  });
  test('an unusable locale falls back to Monday', () => {
    assert.equal(firstDayOf('not a locale'), 1);
  });
  test('always names a real weekday', () => {
    for (const locale of ['en-US', 'en-GB', 'ja-JP', 'de-DE', 'ar-EG', 'fa-IR']) {
      const day = firstDayOf(locale);
      assert.ok(Number.isInteger(day) && day >= 0 && day <= 6, `${locale} gave ${day}`);
    }
  });
});

describe('weekDates', () => {
  test('gives seven consecutive days', () => {
    const week = weekDates(d(2026, 6, 17), 1);
    assert.equal(week.length, 7);
    for (let i = 1; i < 7; i++) {
      assert.equal((week[i] - week[i - 1]) / 864e5, 1, `day ${i} is not the next day`);
    }
  });
  test('begins on the day asked for', () => {
    assert.equal(weekDates(d(2026, 6, 17), 1)[0].getDay(), 1);
    assert.equal(weekDates(d(2026, 6, 17), 0)[0].getDay(), 0);
    assert.equal(weekDates(d(2026, 6, 17), 6)[0].getDay(), 6);
  });
  test('contains the date it was given', () => {
    for (const start of [0, 1, 6]) {
      const week = weekDates(d(2026, 6, 17), start);
      assert.ok(week.some(day => sameDay(day, d(2026, 6, 17))), `weekStart ${start} lost the date`);
    }
  });
  test('reaches back into the year before', () => {
    // Thu 1 Jan 2026, week beginning Monday, starts on Mon 29 December 2025
    const week = weekDates(d(2026, 1, 1), 1);
    assert.equal(week[0].getFullYear(), 2025);
    assert.equal(week[0].getMonth(), 11);
    assert.equal(week[0].getDate(), 29);
    assert.equal(week[6].getDate(), 4);
  });
  test('steps over a leap day', () => {
    const week = weekDates(d(2024, 2, 28), 1);
    assert.ok(week.some(day => day.getMonth() === 1 && day.getDate() === 29), '29 February is missing');
  });
});

describe('sameDay', () => {
  test('ignores the time', () => {
    assert.ok(sameDay(new Date(2026, 3, 5, 0, 0), new Date(2026, 3, 5, 23, 59)));
  });
  test('separates neighbouring days, and the same day in another year', () => {
    assert.ok(!sameDay(d(2026, 3, 5), d(2026, 3, 6)));
    assert.ok(!sameDay(d(2026, 3, 5), d(2025, 3, 5)));
    assert.ok(!sameDay(d(2026, 3, 5), d(2026, 4, 5)));
  });
});

describe('stampCells', () => {
  test('a month has as many days as the month really has', () => {
    assert.equal(stampCells('day', d(2024, 2, 10)).length, 29);  // leap
    assert.equal(stampCells('day', d(2023, 2, 10)).length, 28);
    assert.equal(stampCells('day', d(2026, 4, 10)).length, 30);
    assert.equal(stampCells('day', d(2026, 1, 10)).length, 31);
  });
  test('states run past, current, future around the date', () => {
    const days = stampCells('day', d(2026, 4, 10));
    assert.equal(days[8].state, 'past');
    assert.equal(days[9].state, 'current');
    assert.equal(days[10].state, 'future');
  });
  test('a year of months marks the month the date is in', () => {
    const months = stampCells('month', d(2026, 4, 10));
    assert.equal(months.length, 12);
    assert.equal(months[3].state, 'current');
    assert.equal(months[2].state, 'past');
    assert.equal(months[4].state, 'future');
  });
  test('a run of years is centred on the date', () => {
    const years = stampCells('year', d(2026, 4, 10), { years: 5 });
    assert.deepEqual(years.map(y => y.label), ['2024', '2025', '2026', '2027', '2028']);
    assert.equal(years[2].state, 'current');
  });
  test('a run of years can start where it is told', () => {
    const years = stampCells('year', d(2026, 4, 10), { years: 3, from: 2030 });
    assert.deepEqual(years.map(y => y.label), ['2030', '2031', '2032']);
    assert.equal(years[0].state, 'future');
  });
  test('a week has seven days and carries the dates they stand for', () => {
    const week = stampCells('week', d(2026, 6, 17), { weekStart: 1 });
    assert.equal(week.length, 7);
    assert.ok(week.every(cell => cell.date instanceof Date));
  });
});

describe('stampLayout', () => {
  test('a month calendar is whole weeks, blanks included', () => {
    const { sections } = stampLayout('month', d(2026, 4, 10), { weekStart: 1 });
    const days = sections.find(s => s.part === 'days');
    for (const row of days.rows) assert.equal(row.length, 7);
    const cells = days.rows.flat();
    // April 2026 begins on a Wednesday, so two blanks lead it when weeks start on Monday
    assert.equal(cells.filter(c => c.label === '').length, cells.length - 30);
    assert.equal(cells[0].label, '');
    assert.equal(cells[2].label, '1');
  });
  test('a bar is a single row', () => {
    const { sections } = stampLayout('week', d(2026, 4, 10), { variant: 'bar' });
    assert.equal(sections.length, 1);
    assert.equal(sections[0].rows.length, 1);
  });
  test('rows to fill in are numbered and carry their column date', () => {
    const { sections } = stampLayout('week', d(2026, 4, 10), { rows: ['Run', 'Read'], weekStart: 1 });
    const write = sections.find(s => s.part === 'write');
    assert.equal(write.rows.length, 2);
    assert.equal(write.rows[0][0].label, 'Run');
    assert.equal(write.rows[1][0].label, 'Read');
    assert.ok(write.rows[0].slice(1).every(c => c.row === 1 && c.date instanceof Date));
    assert.ok(write.rows[1].slice(1).every(c => c.row === 2));
  });
  test('a title is put above everything else', () => {
    const { sections } = stampLayout('week', d(2026, 4, 10), { title: 'This week' });
    assert.equal(sections[0].part, 'title');
    assert.equal(sections[0].rows[0][0].label, 'This week');
  });
});

describe('cellKey and fillKey', () => {
  const stamp = d(2026, 10, 1);
  test('a day key is padded to a sortable date', () => {
    assert.equal(cellKey('days', { date: d(2026, 10, 3) }), 'd:2026-10-03');
    assert.equal(cellKey('days', { date: d(2026, 1, 9) }), 'd:2026-01-09');
  });
  test('month and year parts key by month and year', () => {
    assert.equal(cellKey('months', { date: d(2026, 3, 1) }), 'm:2026-03');
    assert.equal(cellKey('bar', { date: d(2026, 3, 1) }, 'year'), 'y:2026');
    assert.equal(cellKey('bar', { date: d(2026, 3, 1) }, 'month'), 'm:2026-03');
  });
  test('a cell with no date has no key', () => {
    assert.equal(cellKey('days', { label: '' }), null);
  });
  test('content names a cell by date, day or month', () => {
    assert.equal(fillKey({ date: '2026-10-03' }, stamp), 'd:2026-10-03');
    assert.equal(fillKey({ date: '2026-10' }, stamp), 'm:2026-10');
    assert.equal(fillKey({ date: '2026' }, stamp), 'y:2026');
    assert.equal(fillKey({ day: 3 }, stamp), 'd:2026-10-03');
    assert.equal(fillKey({ month: 3 }, stamp), 'm:2026-03');
    assert.equal(fillKey({}, stamp), null);
  });
  test('an unpadded date still matches the key a cell makes', () => {
    assert.equal(fillKey({ date: '2026-1-2' }, stamp), 'd:2026-01-02');
    assert.equal(fillKey({ date: '2026-1-2' }, stamp), cellKey('days', { date: d(2026, 1, 2) }));
  });
});

describe('dayParts and stampLabel', () => {
  test('a heading carries the day, its names and its week', () => {
    const parts = dayParts(d(2026, 1, 1), 'en-GB');
    assert.equal(parts.day, 1);
    assert.equal(parts.weekday, 'Thursday');
    assert.equal(parts.week, 1);
    assert.match(parts.month, /2026/);
    assert.equal([...parts.kanji].length, 1, 'the kanji is one character');
  });
  test('a marked week stamp reads as a full date, an unmarked month as a month', () => {
    assert.match(stampLabel('week', d(2026, 1, 1), 'en-GB'), /2026/);
    const unmarked = stampLabel('month', d(2026, 1, 1), 'en-GB', { mark: 'none' });
    assert.ok(!/\b1\b/.test(unmarked), `an unmarked calendar should not name a day: ${unmarked}`);
  });
  test('a year bar says only the year', () => {
    assert.equal(stampLabel('year', d(2026, 4, 10), 'en-GB', { variant: 'bar' }), '2026');
  });
});
