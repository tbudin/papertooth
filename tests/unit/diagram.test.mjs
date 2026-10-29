// The Mermaid subset the diagrams are written in. Parsing only — the drawing
// needs a canvas to measure text, and is covered by the browser suite.
//
// The expectations are Mermaid's syntax, not whatever this parser happened to
// return: `my-node --> other` is one node joined to another in Mermaid, and it
// used to parse here as a lone node called `my` with the edge silently dropped.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { kindOf, parseFlow, parsePie, parseXY } from '../../src/js/diagram.js';

const flow = body => parseFlow('flowchart TD\n' + body);
const pairs = edges => edges.map(e => `${e.from}->${e.to}`);

describe('kindOf', () => {
  test('names the three kinds from the first line', () => {
    assert.equal(kindOf('flowchart TD\nA --> B'), 'flow');
    assert.equal(kindOf('graph LR\nA --> B'), 'flow');
    assert.equal(kindOf('pie title Votes'), 'pie');
    assert.equal(kindOf('xychart-beta'), 'xy');
    assert.equal(kindOf('xychart'), 'xy');
  });
  test('ignores case and leading blank lines', () => {
    assert.equal(kindOf('\n  FlowChart TD\nA --> B'), 'flow');
  });
  test('anything else is not a diagram', () => {
    assert.equal(kindOf('just some text'), null);
    assert.equal(kindOf(''), null);
    assert.equal(kindOf('flowcharts are nice'), null);  // \b, not a prefix match
  });
});

describe('parseFlow', () => {
  test('reads a plain edge', () => {
    const { nodes, edges } = flow('A --> B');
    assert.deepEqual([...nodes.keys()], ['A', 'B']);
    assert.deepEqual(pairs(edges), ['A->B']);
    assert.equal(edges[0].arrow, true);
    assert.equal(edges[0].style, 'solid');
  });

  test('keeps a hyphen inside a node id', () => {
    const { nodes, edges } = flow('my-node --> other');
    assert.deepEqual([...nodes.keys()], ['my-node', 'other']);
    assert.deepEqual(pairs(edges), ['my-node->other']);
  });

  test('keeps hyphenated ids with no spaces, and down a chain', () => {
    assert.deepEqual(pairs(flow('my-node-->other').edges), ['my-node->other']);
    assert.deepEqual(pairs(flow('x-1 --> y-2 --> z-3').edges), ['x-1->y-2', 'y-2->z-3']);
  });

  test('reads the direction, treating TB as TD', () => {
    assert.equal(parseFlow('flowchart LR\nA --> B').dir, 'LR');
    assert.equal(parseFlow('flowchart TB\nA --> B').dir, 'TD');
    assert.equal(parseFlow('graph\nA --> B').dir, 'TD');
  });

  test('reads each node shape', () => {
    const shapes = {
      'A[box]': 'rect', 'A(round)': 'round', 'A([stadium])': 'stadium',
      'A[(cylinder)]': 'cylinder', 'A((circle))': 'circle', 'A[[subroutine]]': 'subroutine',
      'A{diamond}': 'diamond', 'A>flag]': 'flag',
    };
    for (const [src, shape] of Object.entries(shapes)) {
      assert.equal(flow(src + ' --> B').nodes.get('A').shape, shape, src);
    }
  });

  test('a node keeps its id as its label until one is given', () => {
    assert.equal(flow('A --> B').nodes.get('A').label, 'A');
    assert.equal(flow('A[Start here] --> B').nodes.get('A').label, 'Start here');
    assert.equal(flow('A["Quoted"] --> B').nodes.get('A').label, 'Quoted');
  });

  test('a line break in a label becomes a newline', () => {
    assert.equal(flow('A[one<br>two] --> B').nodes.get('A').label, 'one\ntwo');
    assert.equal(flow('A[one<br/>two] --> B').nodes.get('A').label, 'one\ntwo');
  });

  test('reads the edge styles and whether they carry an arrow', () => {
    const edge = src => flow(src).edges[0];
    assert.deepEqual([edge('A --> B').style, edge('A --> B').arrow], ['solid', true]);
    assert.deepEqual([edge('A --- B').style, edge('A --- B').arrow], ['solid', false]);
    assert.deepEqual([edge('A ==> B').style, edge('A ==> B').arrow], ['thick', true]);
    assert.deepEqual([edge('A === B').style, edge('A === B').arrow], ['thick', false]);
    assert.deepEqual([edge('A -.-> B').style, edge('A -.-> B').arrow], ['dotted', true]);
  });

  test('reads an edge label, written either way', () => {
    assert.equal(flow('A -->|yes| B').edges[0].label, 'yes');
    assert.equal(flow('A -- yes --> B').edges[0].label, 'yes');
    assert.equal(flow('A == heavy ==> B').edges[0].label, 'heavy');
    assert.equal(flow('A --> B').edges[0].label, '');
  });

  test('a labelled edge keeps its style', () => {
    assert.equal(flow('A == heavy ==> B').edges[0].style, 'thick');
    assert.equal(flow('A -. maybe .-> B').edges[0].style, 'dotted');
  });

  test('skips comments and the directives it does not draw', () => {
    const { nodes, edges } = flow('%% a comment\nsubgraph One\nA --> B\nend\nstyle A fill:#f00\nclick A "x"');
    assert.deepEqual([...nodes.keys()], ['A', 'B']);
    assert.deepEqual(pairs(edges), ['A->B']);
  });

  test('takes semicolons as line breaks', () => {
    assert.deepEqual(pairs(flow('A --> B; B --> C').edges), ['A->B', 'B->C']);
  });

  test('a node named twice keeps the label it was given', () => {
    const { nodes } = flow('A[Start] --> B\nB --> A');
    assert.equal(nodes.get('A').label, 'Start');
    assert.equal(nodes.size, 2);
  });
});

describe('parsePie', () => {
  test('reads the slices', () => {
    const { items } = parsePie('pie\n"Dogs" : 386\n"Cats" : 85');
    assert.deepEqual(items, [{ label: 'Dogs', value: 386 }, { label: 'Cats', value: 85 }]);
  });
  test('reads a title from the first line or its own', () => {
    assert.equal(parsePie('pie title Pets\n"Dogs" : 1').title, 'Pets');
    assert.equal(parsePie('pie\ntitle Pets\n"Dogs" : 1').title, 'Pets');
  });
  test('notices showData', () => {
    assert.equal(parsePie('pie showData\n"Dogs" : 1').showData, true);
    assert.equal(parsePie('pie\n"Dogs" : 1').showData, false);
  });
  test('takes an unquoted label and a decimal value', () => {
    assert.deepEqual(parsePie('pie\nDogs : 38.5').items, [{ label: 'Dogs', value: 38.5 }]);
  });
});

describe('parseXY', () => {
  test('reads an axis with a label and one without', () => {
    const withLabel = parseXY('xychart-beta\nx-axis "Month" [jan, feb, mar]');
    assert.equal(withLabel.xLabel, 'Month');
    assert.deepEqual(withLabel.x, ['jan', 'feb', 'mar']);
    const bare = parseXY('xychart-beta\nx-axis [jan, feb]');
    assert.equal(bare.xLabel, '');
    assert.deepEqual(bare.x, ['jan', 'feb']);
  });
  test('reads a y range, with or without a label', () => {
    const a = parseXY('xychart-beta\ny-axis "Revenue" 0 --> 100');
    assert.deepEqual([a.yLabel, a.min, a.max], ['Revenue', 0, 100]);
    const b = parseXY('xychart-beta\ny-axis 0 --> 50');
    assert.deepEqual([b.yLabel, b.min, b.max], ['', 0, 50]);
  });
  test('reads bar and line series, named or not', () => {
    const { series } = parseXY('xychart-beta\nbar "Sales" [1, 2, 3]\nline [4, 5, 6]');
    assert.equal(series.length, 2);
    assert.deepEqual(series[0], { type: 'bar', name: 'Sales', values: [1, 2, 3] });
    assert.deepEqual(series[1], { type: 'line', name: '', values: [4, 5, 6] });
  });
  test('notices a horizontal chart', () => {
    assert.equal(parseXY('xychart-beta horizontal\nbar [1]').horizontal, true);
    assert.equal(parseXY('xychart-beta\nbar [1]').horizontal, false);
  });
  test('reads a title', () => {
    assert.equal(parseXY('xychart-beta\ntitle "Sales per month"').title, 'Sales per month');
  });
});
