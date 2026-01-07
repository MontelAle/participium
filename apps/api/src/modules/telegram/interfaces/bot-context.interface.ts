import { Context, Scenes } from 'telegraf';
import { ReportSessionData } from './report-session.interface';

export interface SessionData extends Scenes.SceneSession {
  reportData?: ReportSessionData;
}

export interface BotContext extends Context {
  scene: Scenes.SceneContextScene<BotContext>;
  session: SessionData;
  match?: RegExpMatchArray;
}
