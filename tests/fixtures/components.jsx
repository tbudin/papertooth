// Components shared by the test pages and the server render (no side effects, so it also loads in Node).
import { useState } from 'react';
import { usePapertooth, Btn, Mark, Anno, Wobble, Check, DayHead, Week, Habits, DateStamp } from 'papertooth/react';

/* re-rendered content, also rendered on the server for the hydration test */
export function Notes({ step = 0 }) {
  const items = step === 0 ? ['Alpha', 'Beta'] : ['Beta'];
  return (
    <main className="pt-sheet">
      <Wobble as="h1">{step === 0 ? 'Hello' : 'Goodbye'}</Wobble>
      <Btn href="#">{step === 0 ? 'Save' : 'Saved'}</Btn>
      <Btn outline hover="circle">{step === 0 ? 'More' : 'Less'}</Btn>
      <p>A <Mark>{step === 0 ? 'first' : 'second'}</Mark> highlight and a <Anno anno="circle">{step === 0 ? 'circled' : 'changed'}</Anno> word.</p>
      <ul className="pt-todo">{items.map(t => <li key={t}><Check defaultChecked={t === 'Beta'}>{t}</Check></li>)}</ul>
    </main>
  );
}
const day = new Date(2026, 9, 21);   // Wednesday 21 October 2026
export function Planner({ onToggle }) {
  return (
    <main className="pt-sheet">
      <DayHead id="gb" date={day} />
      <DayHead id="fr" date={day} locale="fr-FR" weekLabel={n => `Semaine ${n}`} />
      <Week id="w-gb" date={day}>{({ date }) => <p>{date.getDate() === 21 ? 'Print proofs' : null}</p>}</Week>
      <Week id="w-us" date={day} locale="en-US" weekStart={0} />
      <DateStamp id="ds" unit="week" date={day} past="x" ink="blue" />
      <Habits id="h" head={['M', 'T', 'W']} habits={[{ name: 'Read', done: [true, false, true] }, { name: 'Run', ink: 'ink-beni', done: [false, false, false] }]} onToggle={onToggle} />
    </main>
  );
}
export function Started({ children, options }) { usePapertooth({ seed: 3, ...options }); return children; }


/* the same tree on the server and in the browser: useId, and so every seeded shape, depends on it */
export function HydrateApp({ onToggle }) {
  return <Started options={{ lazy: false, motion: 'none' }}><Planner onToggle={onToggle} /></Started>;
}
