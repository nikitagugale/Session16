// The two kinds of error this module throws on purpose. See docs/tolerance-spec.md.

export class ParseError extends Error {
  constructor(raw, why = 'not a valid sensor reading') {
    super(`${why}: ${JSON.stringify(raw)}`);
    this.name = 'ParseError';
    this.raw = raw;
  }
}

export class UnknownPartError extends Error {
  constructor(partType) {
    super(`unknown part type: ${JSON.stringify(partType)}`);
    this.name = 'UnknownPartError';
    this.partType = partType;
  }
}
