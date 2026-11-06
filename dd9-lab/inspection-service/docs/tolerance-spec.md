# Tolerance specification: shop-floor quality inspection (v1.2)

*Halden Precision (a made-up factory). Owner: Quality Engineering. This is the document the inspection code is supposed to follow.
When the code and this document disagree, the document is right until Quality Engineering says otherwise.*

## 1. What the module does

Every machined part is measured once at the gauge station. The gauge sends text such as `25.04`. The module turns that text into a
number of millimetres (section 2) and decides what to do with the part (section 4). Lots of parts are sampled for a closer look
(section 6).

## 2. The gauge text: `parseSensorReading(raw)`

2.1 A valid reading is an optional minus sign, one to four digits, and optionally a decimal point followed by one to four digits.
Examples: `25`, `25.04`, `-0.5`, `0012.5`. Spaces, tabs and line ends around the reading are ignored.

2.2 Anything else is malformed, and the parser **throws a `ParseError`**. It never returns `NaN` or `undefined`, and it never
guesses. Malformed means: empty text or only spaces, text after the number (`12.5mm`), a second decimal point (`12.5.3`), a decimal
comma (`12,5`), an exponent (`1e3`), a plus sign, `Infinity` or `NaN`, thousands separators (`1,250`), invisible characters such as
a zero-width space, and any input that is not a string at all.

2.3 The result is a number of millimetres. A negative number parses; the classifier rejects it later (4.6).

## 3. Part types

`classifyDefect` knows these parts (the table lives in `src/inspection/parts.js`). Sizes are in millimetres.

| Part | Nominal | Tolerance |
|---|---|---|
| shaft | 25.00 | 0.05 |
| bore | 40.00 | 0.02 |
| bracket | 12.70 | 0.10 |
| spacer | 6.35 | 0.07 |
| sleeve | 19.05 | 0.03 |
| shim | 1.60 | 0.05 |
| washer | 3.20 | 0.15 |

## 4. Classifying a reading: `classifyDefect(reading, partType)`

For a part, **upper limit = nominal + tolerance** and **lower limit = nominal − tolerance**.

4.1 **Pass.** The part passes only if the reading is strictly between the limits: lower limit < reading < upper limit.

4.2 **Rework.** A reading at or above the upper limit means the part is too big. It can be machined down, so the answer is `'rework'`.

4.3 **Scrap.** A reading at or below the lower limit means the part is too small and cannot be fixed. The answer is `'scrap'`.

4.4 **A part exactly on a limit is outside.** The gauge's own error is as large as the tolerance, so a part sitting exactly on a limit
is not accepted. This holds for every part type, whatever its decimals. The gauge measures to 0.001 mm, so **compare readings and
limits at 0.001 mm** (round to the nearest 0.001 first), never as raw floating-point numbers.

4.5 **No reading.** If the gauge sent nothing (`null`, `undefined`, `NaN`, or anything that is not a number), the answer is
`'recheck'`. Nobody should scrap or pass a part nobody measured.

4.6 **Impossible reading.** A reading of zero or less, or more than twice the part's nominal size, or infinite, is a sensor fault and
not a verdict on the part. The answer is `'recheck'`. (A reading of exactly twice the nominal size is possible, and is classified
under 4.2.) These two checks look at the reading as the gauge sent it, before any rounding.

4.7 **Unknown part type.** A part type that is not in the table is a data error. The function **throws an `UnknownPartError`**
before it looks at the reading, so a wrong part code can never be hidden by a verdict.

## 5. Not covered here

Labels on the shop-floor screen (`label.js`) and anything about the gauge hardware.

## 6. Sampling plan: `sampleSize(lotSize)`

6.1 How many parts to inspect from a lot depends on the lot size. The bands include their largest value:

| Lot size | Parts to inspect |
|---|---|
| 2 to 8 | 2 |
| 9 to 15 | 3 |
| 16 to 25 | 5 |
| 26 to 50 | 8 |
| 51 to 90 | 13 |
| 91 to 150 | 20 |
| 151 to 280 | 32 |
| 281 to 500 | 50 |
| 501 to 1,200 | 80 |
| 1,201 and above | 125 |

6.2 A lot is a whole number of parts, and there must be at least two. Anything else (zero, a negative number, a fraction, `NaN`, a
string, `null`) is a data error: the function **throws a `RangeError`**.
