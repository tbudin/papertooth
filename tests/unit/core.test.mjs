// The helpers every drawing is built from. No DOM, so node runs them directly.
//
// toRgb is here because of a real regression: a lint fix removed the spread in
// `[...c.slice(1, 4)].map(...)`, reading String#slice as Array#slice. Strings
// have no .map, so every three-digit hex threw. Twenty-two browser tests passed
// through it, because none of them named a colour that short.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { f, rng, curve, jit, stroke, toRgb, rgbHex, toHex, svgDoc, enc } from '../../src/js/core.js';

describe('f', () => {
  test('rounds to one decimal', () => {
    assert.equal(f(1.24), '1.2');
    assert.equal(f(1.25), '1.3');
    assert.equal(f(-1.25), '-1.2');     // Math.round takes the upper value at .5
  });
  test('drops a trailing zero, so the SVG stays short', () => {
    assert.equal(f(3), '3');
    assert.equal(f(3.0001), '3');
    assert.equal(f(0), '0');
  });
});

describe('rng', () => {
  test('the same seed draws the same picture', () => {
    const a = rng(42), b = rng(42);
    const left = Array.from({ length: 20 }, a);
    const right = Array.from({ length: 20 }, b);
    assert.deepEqual(left, right);
  });
  test('different seeds diverge', () => {
    assert.notEqual(rng(1)(), rng(2)());
  });
  test('stays in [0, 1)', () => {
    for (const seed of [0, 1, -7, 2 ** 31 - 1]) {
      const r = rng(seed);
      for (let i = 0; i < 200; i++) {
        const n = r();
        assert.ok(n >= 0 && n < 1, `seed ${seed} produced ${n}`);
      }
    }
  });
  test('a sequence is not constant', () => {
    const r = rng(9);
    assert.equal(new Set(Array.from({ length: 50 }, r)).size, 50);
  });
});

describe('curve', () => {
  const pts = [[0, 0], [10, 10], [20, 0], [30, 10]];
  test('moves to the first point only when asked', () => {
    assert.match(curve(pts, true), /^M0 0 C/);
    assert.match(curve(pts, false), /^ C/);
  });
  test('draws one cubic per gap between points', () => {
    assert.equal(curve(pts, true).match(/C/g).length, pts.length - 1);
  });
  test('ends on the last point', () => {
    assert.match(curve(pts, true), /C[-\d. ]+30 10$/);
  });
  test('is deterministic', () => {
    assert.equal(curve(pts, true), curve(pts, true));
  });
});

describe('jit', () => {
  test('moves a point by at most half the amount, either way', () => {
    const r = rng(3);
    for (let i = 0; i < 100; i++) {
      const [x, y] = jit([10, 20], r, 4);
      assert.ok(Math.abs(x - 10) <= 2, `x moved ${x - 10}`);
      assert.ok(Math.abs(y - 20) <= 2, `y moved ${y - 20}`);
    }
  });
  test('an amount of zero leaves the point alone', () => {
    assert.deepEqual(jit([5, 6], rng(1), 0), [5, 6]);
  });
});

describe('stroke', () => {
  test('is one quadratic from a to b', () => {
    assert.match(stroke([0, 0], [10, 0], rng(1), 2, 3), /^M[-\d. ]+ Q[-\d. ]+$/);
  });
  test('repeats exactly for the same seed', () => {
    assert.equal(stroke([0, 0], [10, 0], rng(5), 2, 3), stroke([0, 0], [10, 0], rng(5), 2, 3));
  });
  test('a zero-length stroke does not divide by zero', () => {
    assert.doesNotMatch(stroke([4, 4], [4, 4], rng(1), 2, 3), /NaN/);
  });
});

describe('toRgb', () => {
  test('reads a three-digit hex by doubling each digit', () => {
    assert.deepEqual(toRgb('#abc'), [170, 187, 204]);
    assert.deepEqual(toRgb('#fff'), [255, 255, 255]);
    assert.deepEqual(toRgb('#000'), [0, 0, 0]);
  });
  test('a three-digit hex means the same as its six-digit form', () => {
    assert.deepEqual(toRgb('#abc'), toRgb('#aabbcc'));
    assert.deepEqual(toRgb('#f0a'), toRgb('#ff00aa'));
  });
  test('reads a six-digit hex, and ignores any alpha after it', () => {
    assert.deepEqual(toRgb('#aabbcc'), [170, 187, 204]);
    assert.deepEqual(toRgb('#aabbccdd'), [170, 187, 204]);
  });
  test('is not case sensitive, and tolerates surrounding space', () => {
    assert.deepEqual(toRgb('#ABC'), [170, 187, 204]);
    assert.deepEqual(toRgb('  #AaBbCc  '), [170, 187, 204]);
  });
  test('reads rgb() and rgba()', () => {
    assert.deepEqual(toRgb('rgb(1, 2, 3)'), [1, 2, 3]);
    assert.deepEqual(toRgb('rgba(4, 5, 6, 0.5)'), [4, 5, 6]);
  });
});

describe('rgbHex', () => {
  test('pads each channel to two digits', () => {
    assert.equal(rgbHex([0, 0, 0]), '#000000');
    assert.equal(rgbHex([1, 2, 3]), '#010203');
  });
  test('rounds and clamps what is out of range', () => {
    assert.equal(rgbHex([255.6, -4, 300]), '#ff00ff');
    assert.equal(rgbHex([-1, 128.4, 256]), '#0080ff');
  });
  test('round-trips a hex colour', () => {
    for (const hex of ['#aabbcc', '#000000', '#ffffff', '#010203']) {
      assert.equal(toHex(hex), hex);
    }
    assert.equal(toHex('#abc'), '#aabbcc');
  });
});

describe('svgDoc and enc', () => {
  test('the document carries its size and a matching viewBox', () => {
    const doc = svgDoc(10, 20, '<rect/>');
    assert.match(doc, /width="10"/);
    assert.match(doc, /height="20"/);
    assert.match(doc, /viewBox="0 0 10 20"/);
    assert.match(doc, /<rect\/><\/svg>$/);
  });
  test('enc produces a url() a stylesheet can take', () => {
    const url = enc('<svg><rect/></svg>');
    assert.match(url, /^url\("data:image\/svg\+xml,/);
    assert.ok(!url.includes('<'), 'the markup must be percent-encoded');
  });
});
