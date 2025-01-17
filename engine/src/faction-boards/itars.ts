import { Building, Faction } from "../enums";
import { FactionBoardVariants } from "./types";

const itars: FactionBoardVariants = {
  standard: {
    faction: Faction.Itars,
    buildings: {
      [Building.Academy1]: {
        income: [["+3k", "tech"]],
      },
    },
    income: ["3k,5o,15c,q", "+o,k,t"],
    power: {
      area1: 4,
    },
    handlers: {
      burn: (player, amount) => (player.data.power.gaia += amount),
    },
  },
  variants: [
    {
      type: "more-balanced",
      board: {
        income: ["3k,4o,15c,q", "+o,k,t"],
      },
    },
    {
      type: "more-balanced",
      players: 2,
      board: {
        income: ["3k,4o,15c,q", "+o,k"],
        buildings: {
          [Building.PlanetaryInstitute]: {
            cost: "6c,4o",
            income: [["+4pw", "+2t"]],
          },
        },
      },
    },
  ],
};

export default itars;
