import {Grid, Hex, CubeCoordinates} from "hexagrid";
import * as seedrandom from "seedrandom";
import * as shuffleSeed from "shuffle-seed";
import Sector, { GaiaHexData } from "./sector";

// Data: from outer ring to inside ring, starting from a corner
const s1 = {name: "s1", map: "eeeeemevoeed,sereee,e".replace(/,/g, "")};
const s2 = {name: "s2", map: "evteedemeoee,eeiees,e".replace(/,/g, "")};
const s3 = {name: "s3", map: "eemeeteedree,geeiee,e".replace(/,/g, "")};
const s4 = {name: "s4", map: "eeteeereeeei,eoesev,e".replace(/,/g, "")};
const s5 = {name: "s5", map: "eeiemoeedvee,geeeee,e".replace(/,/g, "")};
const s5b = {name: "s5b", map: "eeiemoeeevee,geeeee,e".replace(/,/g, "")};
const s6 = {name: "s6", map: "eeemeedmeeee,serege,e".replace(/,/g, "")};
const s6b = {name: "s6b", map: "eeemeedmeeee,eerege,e".replace(/,/g, "")};
const s7 = {name: "s7", map: "meeseeeeteee,eoegeg,e".replace(/,/g, "")};
const s7b = {name: "s7b", map: "meeeeeeeteee,egeseg,e".replace(/,/g, "")};
const s8 = {name: "s8", map: "eeremeeeemee,eietev,e".replace(/,/g, "")};
const s9 = {name: "s9", map: "evemieeeeese,eeeget,e".replace(/,/g, "")};
const s10 = {name: "s10", map: "eeemmeeeeore,deegee,e".replace(/,/g, "")};

const smallConfiguration = {
  sectors: [s1, s2, s3, s4, s5b, s6b, s7b],
  nbSectors: 7,
  centers: [{q: 0, r: 0, s: 0}]
};

const bigConfiguration = {
  sectors: [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10],
  nbSectors: 10,
  centers: [{q: 0, r: 0, s: 0}]
};

// Centers of the small configuration
for (let i = 0; i < 6; i++) {
  const hex = new Hex(5, -2);
  hex.rotateLeft(i);

  smallConfiguration.centers.push(hex.toJSON());
  bigConfiguration.centers.push(hex.toJSON());
}

// Big configuration: add 3 more
for (let i = -1; i <= 1; i++) {
  const hex = new Hex(10, -4);
  hex.rotateLeft(i, {q: 5, r: -2, s: -3});
  bigConfiguration.centers.push(hex);
}

export default class SpaceMap {
  rng: seedrandom.prng;
  nbPlayers: number;
  grid: Grid<GaiaHexData>; // hexagrid

  constructor(nbPlayers ?: number, seed ?: string) {
    if (nbPlayers === undefined) {
      return;
    }

    this.nbPlayers = nbPlayers;
    this.rng = seedrandom(seed);
    
    do {
      this.generate();
    } while (!this.isValid());
  }

  /** 
   *  Check if the map is correct (no two planets of the same color side by side)
  */
  isValid(): boolean {
    return true;
  }

  /** 
   * Generate the map
  */
  generate() {
    const definitions = this.chooseSides();
    const centers = this.configuration().centers;

    const [hexagon, ...hexagons] = definitions.map((side, index) => Sector.create(side.map, side.name, centers[index]).rotateLeft(Math.floor(this.rng()*6), centers[index]));

    this.grid = hexagon.merge(...hexagons);
  }

  chooseSides() : Array<{map: string, name: string}> {
    const definitions = this.configuration().sectors;
    // Random sort of the chosen sectors, sliced
    return shuffleSeed.shuffle(definitions, this.rng()).slice(0, this.configuration().nbSectors);
  }

  toJSON() {
    return Array.from(this.grid.values());
  }

  static fromData(data: any) {
    const map = new SpaceMap();

    map.grid = new Grid(...data);

    return map;
  }

  configuration() {
    return SpaceMap.configuration(this.nbPlayers);
  }

  static configuration(nbPlayers: number) {
    if (nbPlayers <= 2) {
      return smallConfiguration;
    } else {
      return bigConfiguration;
    }
  }
}