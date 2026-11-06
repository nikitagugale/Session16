# Edge cases for sampleSize (section 6 of the specification)

| Case | Input | Expected | Why it matters |
|---|---|---|---|
| top of the first band | 8 | 2 | the bands include their largest value |
| first lot of the second band | 9 | 3 | one more part changes the sample |
| top of every other band | 15, 25, 50, 90, 150, 280, 500, 1200 | 3, 5, 8, 13, 20, 32, 50, 80 | an off-by-one on `<` versus `<=` shows at every edge |
| first lot of the last band | 1201 | 125 | the open-ended band |
| smallest allowed lot | 2 | 2 | the plan starts at two parts |
| too small | 0, 1 | throws RangeError | a lot needs at least two parts |
| negative | -10 | throws RangeError | cannot be a number of parts |
| a fraction | 10.5 | throws RangeError | a lot is whole parts |
| not a number | NaN | throws RangeError | must not silently return undefined |
| text | '10' | throws RangeError | the plan takes numbers only |
