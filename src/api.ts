import * as $ from 'jquery';
import Engine from '@gaia-project/engine';

export interface GameApi {
  loadGame(gameId: string): Promise<Engine>;
  /** Check if we need to refresh the game */
  checkStatus(gameId: string): Promise<any>;
  addMove(gameId: string, move: string): Promise<any>;
  replay(moveList: string[]): Promise<Engine>;
}

const api: GameApi = {
  async loadGame(gameId: string) {
    const data = await $.get(`${window.location.protocol}//${window.location.hostname}:9508/g/${gameId}`);
    return Engine.fromData(data);
  },
  checkStatus(gameId: string) {
    return $.get(`${window.location.protocol}//${window.location.hostname}:9508/g/${gameId}/status`) as any;
  },
  addMove(gameId: string, move: string) {
    return $.post(`${window.location.protocol}//${window.location.hostname}:9508/g/${gameId}/move`,  {move}) as any;
  },
  async replay(moves: string[]) {
    const data = await $.post(`${window.location.protocol}//${window.location.hostname}:9508/`, {moves}) as any;
    return Engine.fromData(data);
  }
}

export default api;