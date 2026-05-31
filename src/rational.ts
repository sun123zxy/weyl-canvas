export type Rational = {
  n: number;
  d: number;
};

export type RationalCoord = {
  x: Rational;
  y: Rational;
};

export function rat(n: number, d = 1): Rational {
  if (d === 0) throw new Error("Zero denominator.");
  const sign = d < 0 ? -1 : 1;
  const divisor = gcd(Math.abs(n), Math.abs(d));
  return {
    n: sign * n / divisor,
    d: Math.abs(d) / divisor,
  };
}

export function add(a: Rational, b: Rational): Rational {
  return rat(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function sub(a: Rational, b: Rational): Rational {
  return rat(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mul(a: Rational, b: Rational): Rational {
  return rat(a.n * b.n, a.d * b.d);
}

export function div(a: Rational, b: Rational): Rational {
  return rat(a.n * b.d, a.d * b.n);
}

export function compare(a: Rational, b: Rational): number {
  return a.n * b.d - b.n * a.d;
}

export function toNumber(value: Rational): number {
  return value.n / value.d;
}

export function rationalKey(value: Rational): string {
  return value.d === 1 ? String(value.n) : `${value.n}/${value.d}`;
}

export function coordKey(coord: RationalCoord): string {
  return `${rationalKey(coord.x)}:${rationalKey(coord.y)}`;
}

export function translateCoord(coord: RationalCoord, x: number, y: number): RationalCoord {
  return {
    x: add(coord.x, rat(x)),
    y: add(coord.y, rat(y)),
  };
}

export function coordToNumber(coord: RationalCoord) {
  return {
    x: toNumber(coord.x),
    y: toNumber(coord.y),
  };
}

function gcd(a: number, b: number): number {
  while (b !== 0) {
    const next = a % b;
    a = b;
    b = next;
  }
  return a || 1;
}
