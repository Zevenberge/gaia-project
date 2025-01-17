import Engine, {
  Building,
  Command,
  EventSource,
  Faction,
  factionBoard,
  factions,
  LogEntry,
  Planet,
  Player,
  PlayerEnum,
  ResearchField,
  Resource,
} from "@gaia-project/engine";
import { ChartStyleDisplay } from "./chart-factory";
import { CommandObject, parseCommands } from "./recent";
import { SimpleSource } from "./simple-charts";

export type ChartColor = string | ((player: Player) => string);

export type ChartFamily = string;
export const vpChartFamily: ChartFamily = "Victory Points";

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type EventFilter = (
  player: PlayerEnum,
  source: EventSource,
  resource: Resource,
  round: number,
  change: number
) => number;

export interface DatasetFactory {
  backgroundColor: ColorVar;
  fill: string | false;
  label: string;
  description?: string;
  getDataPoints: () => number[];
  weight: number;
}

export type IncludeRounds = "all" | "except-final" | "last";

export function chartPlayerOrder(data: Engine): PlayerEnum[] {
  return data.players.map((p) => p.player);
}

export function extractChanges(player: PlayerEnum, extractChange: EventFilter): (entry: LogEntry) => number {
  return (logItem) => {
    if (player != logItem.player) {
      return 0;
    }
    let counter = 0;
    for (const source in logItem.changes) {
      const change = logItem.changes[source];
      for (const resource in change) {
        counter += extractChange(
          logItem.player,
          source as EventSource,
          resource as Resource,
          logItem.round,
          change[resource]
        );
      }
    }
    return counter;
  };
}

export function getDataPoints(
  data: Engine,
  initialValue: number,
  extractChange: (entry: LogEntry) => number,
  extractLog: (moveHistory: string[], entry: LogEntry) => number,
  projectedEndValue: () => number,
  deltaForEnded: () => number,
  includeRounds: IncludeRounds
): number[] {
  const perRoundData: number[] = [0, NaN, NaN, NaN, NaN, NaN, NaN];
  if (includeRounds === "all") {
    perRoundData.push(0);
  }

  let counter = initialValue;
  let round = 0;

  perRoundData[round] = counter;
  for (const logItem of data.advancedLog) {
    if (logItem.round != null && includeRounds != "last") {
      round = logItem.round;
    }

    counter += extractLog(data.moveHistory, logItem);

    if (logItem.changes) {
      counter += extractChange(logItem);
    }
    perRoundData[round] = counter;
  }

  if (data.ended) {
    counter += deltaForEnded();
    perRoundData[6] = counter;
  }

  if (projectedEndValue != null) {
    counter += projectedEndValue();
  }
  if (includeRounds === "all") {
    perRoundData[7] = counter;
  } else if (includeRounds === "last") {
    perRoundData[0] = counter;
  }

  return perRoundData;
}

export class ColorVar {
  color: string;

  constructor(color: string) {
    if (!color.startsWith("--")) {
      throw `${color} does not start with --`;
    }
    this.color = color;
  }

  lookupForChart(style: ChartStyleDisplay, canvas: HTMLCanvasElement): string {
    if (style.type == "chart") {
      return this.lookup(canvas);
    }
    return this.color;
  }

  lookup(canvas: HTMLElement): string | null {
    return window.getComputedStyle(canvas).getPropertyValue(this.color);
  }
}

export function resolveColor(color: ChartColor, player: Player): ColorVar {
  return new ColorVar(typeof color == "string" ? color : color(player));
}

export function planetColor(planet: Planet, invert: boolean): string {
  if (invert && planet == Planet.Ice) {
    return "--current-round";
  } else if (planet == Planet.Empty) {
    //for lantids guest mine
    return "--recent";
  } else {
    return (
      "--" +
      Object.keys(Planet)
        .find((k) => Planet[k] == planet)
        .toLowerCase()
    );
  }
}

export function playerColor(pl: Player, invert: boolean): ColorVar {
  return new ColorVar(planetColor(factions[pl.faction].planet, invert));
}

export function playerLabel(pl: Player) {
  return factions[pl.faction].name;
}

export function weightedSum(data: Engine, player: PlayerEnum, factories: DatasetFactory[]): DatasetFactory | null {
  const pl = data.player(player);
  if (!pl.faction) {
    return null;
  }

  return {
    backgroundColor: playerColor(pl, true),
    label: playerLabel(pl),
    fill: false,
    getDataPoints: () =>
      factories
        .map((f) => f.getDataPoints().map((p) => f.weight * p))
        .reduce((prev: number[], cur: number[]) => {
          for (let i = 0; i < cur.length; i++) {
            prev[i] += cur[i];
          }
          return prev;
        }),
    weight: 1,
  };
}

export function initialResearch(player: Player) {
  const research = new Map<ResearchField, number>();
  factionBoard(player.faction, player.factionVariant).income[0].rewards.forEach((r) => {
    if (r.type.startsWith("up-")) {
      research.set(r.type.slice(3) as ResearchField, 1);
    }
  });
  return research;
}

export function logEntryProcessor(
  processor: (cmd: CommandObject, log: LogEntry, allCommands: CommandObject[]) => number
): (moveHistory: string[], log: LogEntry) => number {
  return (moveHistory: string[], log: LogEntry): number => {
    let res = 0;

    if (log.move != null) {
      const move = moveHistory[log.move]; // current move isn't added yet
      if (move != null) {
        const commands = parseCommands(move);
        for (const cmd of commands) {
          res += processor(cmd, log, commands);
        }
      }
    }

    return res;
  };
}

export type ExtractLog<Source> = (p: Player) => (a: ExtractLogArg<Source>) => number;

export type ExtractLogArg<Source> = {
  cmd: CommandObject;
  allCommands: CommandObject[];
  source: Source;
  data: Engine;
  log: LogEntry;
};

export function statelessExtractLog<Source>(e: (a: ExtractLogArg<Source>) => number): ExtractLog<Source> {
  return (p) => (a) => (a.cmd.faction == p.faction ? e(a) : 0);
}

export function planetCounter<T>(
  includeLantidsGuestMine: (s: SimpleSource<T>) => boolean,
  includeLostPlanet: (s: SimpleSource<T>) => boolean,
  includeRegularPlanet: (planet: Planet, type: T, player: Player) => boolean,
  countTransdim = true,
  value: (cmd: CommandObject, log: LogEntry, planet: Planet, location: string) => number = () => 1
): ExtractLog<SimpleSource<T>> {
  const transdim = new Set<string>();
  const owners: { [key: string]: Faction } = {};

  return (want) => {
    return (e) => {
      const cmd = e.cmd;
      const data = e.data;
      const source = e.source;
      switch (cmd.command) {
        case Command.PlaceLostPlanet:
          return cmd.faction == want.faction && includeLostPlanet(source)
            ? value(cmd, e.log, Planet.Lost, cmd.args[0])
            : 0;
        case Command.Build:
          const building = cmd.args[0] as Building;
          const location = cmd.args[1];
          const { q, r } = data.map.parse(location);
          const hex = data.map.grid.get({ q, r });
          const planet = hex.data.planet;

          const owner = owners[location];
          if (owner == null) {
            owners[location] = cmd.faction;
          }
          if (cmd.faction != want.faction) {
            return 0;
          }

          if (owner != want.faction && want.faction == Faction.Lantids) {
            return includeLantidsGuestMine(source) ? value(cmd, e.log, planet, location) : 0;
          }

          if (building == Building.GaiaFormer && countTransdim) {
            transdim.add(location);

            if (includeRegularPlanet(Planet.Transdim, source.type, want)) {
              return value(cmd, e.log, Planet.Transdim, location);
            }
          }

          if (
            includeRegularPlanet(planet, source.type, want) &&
            (building == Building.Mine || (building == Building.PlanetaryInstitute && want.faction == Faction.Ivits)) &&
            !transdim.has(location)
          ) {
            return value(cmd, e.log, planet, location);
          }
      }
      return 0;
    };
  };
}
