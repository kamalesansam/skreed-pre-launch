// The catalog's own sentences for section 4's five products (the 2026-27 catalog, pages 13 and 15 to 19), for the tests only.
// The site ships the trimmed lines in src/config/room.ts's ROOM_PRODUCTS, which drop rule 17's words ("seamless",
// "seamlessly", "elevate"); these stay out of the client so those words never reach the bundle.
import type { RoomProduct } from '../../src/config/room.ts';

export const ROOM_CATALOG_LINES: Readonly<Record<RoomProduct['id'], string>> = Object.freeze({
  case: 'Enhanced dual-layered protection with a tough Polycarbonate exterior and a flexible TPU core. The perfect balance of style, strength, and functionality. Available in 240 shades. Finish: Matte, Gloss.',
  wallet: 'Sleek and secure MagSafe-compatible phone wallet for convenient card storage without the bulk. Designed to blend seamlessly with your phone case for a clean and minimal look. Available in 240 shades. Finish: Matte, Gloss, Metallic Matte, Metallic Gloss.',
  lenskin: "Sleek metal accent designed to elevate the latest iPhone's camera lens area and personalize your look. Available in a range of contrasting solid shades and patterns. Finish: Matte, Metallic Matte, Metallic Gloss.",
  airpods: 'Durable polycarbonate case with a sleek profile and precise cut-outs for seamless charging and functionality. Includes a convenient carabiner ring for easy attachment to bags. Available in 240 shades. Finish: Matte, Gloss.',
  // page 13's range sentence: the catalog gives AirPods Max no line of its own
  'airpods-max': 'Our range includes Phone Cases for the latest iPhone models (15, 16, 17, and 18 series), Samsung Galaxy S25 and S26 series, Google Pixel 10 and 11 series, AirPods cases for AirPods Pro (2nd & 3rd generation), AirPods (4th generation), and AirPods Max, along with MagSafe Wallets, Lens Skins, Lanyards, Screen Protectors, and Pop Sockets.',
});
