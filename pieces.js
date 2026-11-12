// ===== The outlines of the black shapes (images/flow-piece-NN.svg), copied here =====
// So the project pages can draw their title right away, without loading the files first
// (otherwise the title shows up a moment late and seems to blink after the home page).
// Made from the files by a small script: change the files, then make this again.
// Each one: the drawing's viewBox, and its outlines (closed, so the thin outline goes all the way round).
const PIECE_SHAPES = {
  "flow-piece-01.svg": { viewBox: "0 0 68 68", outlines: ["M0.191021 0C0.191021 0 0.063673 0 0 0V67.4928H67.315C67.315 67.4928 67.4424 67.4928 67.4933 67.4928V0.0127345H0.191021V0Z"] },
  "flow-piece-02.svg": { viewBox: "0 0 68 34", outlines: ["M0 0H67.4927C67.4927 18.6306 52.3769 33.7465 33.7463 33.7465H0V0Z"] },
  "flow-piece-03.svg": { viewBox: "0 0 68 34", outlines: ["M0 33.7461H67.4927C67.4927 15.1155 52.3769 -0.000442505 33.7463 -0.000442505H0V33.7461Z"] },
  "flow-piece-04.svg": { viewBox: "0 0 68 68", outlines: ["M0.19101 0C0.19101 0 0.0636727 0 0 0V67.493H67.3147C67.3147 67.493 67.4421 67.493 67.493 67.493V32.5113C67.5058 14.5556 52.9502 0 35.0072 0H0.19101Z"] },
  "flow-piece-05.svg": { viewBox: "0 0 68 68", outlines: ["M67.3022 67.4922C67.3022 67.4922 67.4295 67.4922 67.4932 67.4922V-0.000602722H0.178139C0.178139 -0.000602722 0.0507812 -0.000602722 -0.000160217 -0.000602722V34.981C-0.0128937 52.9367 14.5428 67.4922 32.4858 67.4922H67.3022Z"] },
  "flow-piece-06.svg": { viewBox: "0 0 34 68", outlines: ["M0 0L2.95021e-06 67.493C18.6306 67.493 33.7465 52.3771 33.7465 33.7465L33.7465 -1.47511e-06L0 0Z"] },
  "flow-piece-07.svg": { viewBox: "0 0 68 68", outlines: ["M0.19101 0C0.19101 0 0.0636727 0 0 0V67.493H67.3147C67.3147 67.493 67.4421 67.493 67.493 67.493V67.3274C67.493 30.1554 37.3631 0.0127275 0.19101 0.0127275V0Z"] },
  "flow-piece-08.svg": { viewBox: "0 0 68 68", outlines: ["M67.3022 0C67.3022 0 67.4295 0 67.4932 0V67.4931H0.178574C0.178574 67.4931 0.0512161 67.4931 0.000274658 67.4931V67.3276C0.000274658 30.1554 30.1301 0.0127276 67.3022 0.0127276V0Z"] },
  "flow-piece-09.svg": { viewBox: "0 0 68 68", outlines: ["M67.4925 67.4795V-0.000389099C30.2188 -0.000389099 0 30.2185 0 67.4922Z"] },
  "flow-piece-10.svg": { viewBox: "0 0 68 68", outlines: ["M-0.000343323 0.0127323V67.4926C37.2734 67.4926 67.4922 37.2737 67.4922 0Z"] },
  "flow-piece-11.svg": { viewBox: "0 0 68 68", outlines: ["M67.4925 0.0127323V67.4926C30.2188 67.4926 0 37.2737 0 0Z"] },
  "flow-piece-12.svg": { viewBox: "0 0 68 68", outlines: ["M0.0127295 67.4928L67.4933 67.4928L0 0Z"] },
  "flow-piece-13.svg": { viewBox: "0 0 34 68", outlines: ["M33.7461 0L33.7461 67.493C15.1155 67.493 -0.000418091 52.3771 -0.000417277 33.7465L-0.000415802 -1.47511e-06L33.7461 0Z"] },
  "flow-piece-14.svg": { viewBox: "0 0 68 68", outlines: ["M67.3012 0C67.3012 0 67.4285 0 67.4922 0V67.4929H0.177345C0.177345 67.4929 0.0499802 67.4929 -0.000961304 67.4929V32.5112C-0.0136948 14.5555 14.5419 0 32.4849 0H67.3012Z"] },
  "flow-piece-15.svg": { viewBox: "0 0 68 68", outlines: ["M67.3022 0C67.3022 0 67.4295 0 67.4932 0V67.4929H0.178322C0.178322 67.4929 0.0509567 67.4929 1.52588e-05 67.4929V32.5112C-0.0127182 14.5555 14.5429 0 32.4859 0H67.3022Z"] },
  "flow-piece-16.svg": { viewBox: "0 0 68 68", outlines: ["M67.4929 0.191C67.4929 0.191 67.4929 0.0637 67.4929 0L-0.0001 0L-0.0001 67.3147C-0.0001 67.3147 -0.0001 67.4421 -0.0001 67.493L34.9817 67.493C52.9374 67.5058 67.4929 52.9502 67.4929 35.0072L67.4929 0.191Z"] },
  "flow-piece-17.svg": { viewBox: "0 0 68 34", outlines: ["M0 0H67.4927V33.7465H0V0Z"] },
  "flow-piece-18.svg": { viewBox: "0 0 68 34", outlines: ["M67.4927 33.7461H0C0 15.1155 15.1158 -0.000442505 33.7464 -0.000442505H67.4927V33.7461Z"] },
  // The two halves of the point of a V (triangles; added for "ISRAELI MOVIE ARCHIVE")
  "flow-piece-19.svg": { viewBox: "0 0 68 68", outlines: ["M67.4928 0V67.4928L0 0H67.4928Z"] },
  "flow-piece-20.svg": { viewBox: "0 0 68 68", outlines: ["M0 0V67.4928L67.4928 0H0Z"] },
};
