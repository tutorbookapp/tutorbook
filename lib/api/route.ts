import {
  NextApiHandler as Handler,
  NextApiRequest as Req,
  NextApiResponse as Res,
} from 'next';

export type Action = (
  req: Req,
  res: Res,
  ...args: unknown[]
) => Promise<boolean>;

export default class Route<ReqBody, ResBody> {
  private actions: Action[] = [];

  public verify(action: Action, ...args: unknown[]): void {
    this.actions.push((req: Req, res: Res, ...chain: unknown[]) => {
      return action(req, res, ...args, ...chain);
    });
  }

  public fn(): Handler<ResBody> {
    return async (req: Req, res: Res) => {
      await this.actions.reduce((cur: Promise<unknown[]>, next: Action) => {
        return cur.then((...chain: unknown[]) => next(req, res, ...chain));
      }, Promise.resolve());
    };
  }
}
