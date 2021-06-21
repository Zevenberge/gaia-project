import { difference } from "lodash";
import Engine from "..";
import { Expansion, Faction, Planet } from "./enums";

type FactionList = { [key: string]: { name: string; planet: Planet } };

export const baseFactions: FactionList = {
  [Faction.Terrans]: {
    name: "Terrans",
    planet: Planet.Terra,
  },
  [Faction.Lantids]: {
    name: "Lantids",
    planet: Planet.Terra,
  },
  [Faction.HadschHallas]: {
    name: "Hadsch Hallas",
    planet: Planet.Oxide,
  },
  [Faction.Ivits]: {
    name: "Ivits",
    planet: Planet.Oxide,
  },
  [Faction.Geodens]: {
    name: "Geoden",
    planet: Planet.Volcanic,
  },
  [Faction.BalTaks]: {
    name: "Bal T'aks",
    planet: Planet.Volcanic,
  },
  [Faction.Xenos]: {
    name: "Xenos",
    planet: Planet.Desert,
  },
  [Faction.Gleens]: {
    name: "Gleens",
    planet: Planet.Desert,
  },
  [Faction.Taklons]: {
    name: "Taklons",
    planet: Planet.Swamp,
  },
  [Faction.Ambas]: {
    name: "Ambas",
    planet: Planet.Swamp,
  },
  [Faction.Firaks]: {
    name: "Firaks",
    planet: Planet.Titanium,
  },
  [Faction.Bescods]: {
    name: "Bescods",
    planet: Planet.Titanium,
  },
  [Faction.Nevlas]: {
    name: "Nevlas",
    planet: Planet.Ice,
  },
  [Faction.Itars]: {
    name: "Itars",
    planet: Planet.Ice,
  },
} as const;

const mooFactions: FactionList= {
  [Faction.Darloks]: {
    name: "Darloks",
    planet: Planet.Titanium,
  },
}

const allFactions = {...baseFactions, ...mooFactions};

function factionsInPlay(expansions: Expansion) : FactionList {
  if(expansions === Expansion.MasterOfOrion) {
    return allFactions;
  }
  return baseFactions;
}

function names(factions: FactionList) {
  return Object.keys(factions) as Faction[];
}

export function remainingFactions(chosenFactions: Faction[], expansions: Expansion) : Faction[] {
  return difference(
    names(factionsInPlay(expansions)),
    chosenFactions,
    chosenFactions.flatMap((f) => oppositeFaction(f, expansions))
  );
}

export function oppositeFaction(faction: Faction, expansions: Expansion): Faction[] {
  const availableFactions = factionsInPlay(expansions);
  const factionNames = names(factionsInPlay(expansions));

  if (!factionNames.includes(faction)) {
    return null;
  }

  return factionNames.filter((fct: Faction) => fct !== faction && availableFactions[fct].planet === availableFactions[faction].planet);
}

export function factionPlanet(faction: Faction): Planet {
  const fact = allFactions[faction];
  if (fact) {
    return fact.planet;
  }
  return Planet.Lost;
}
