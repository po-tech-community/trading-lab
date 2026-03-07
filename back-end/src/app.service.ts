/**
 * Root APP SERVICE – simple health/welcome logic.
 *
 * What it does: getHello(), getHealth(). Injected only by AppController; not exported (no other module needs it).
 *
 * @see https://docs.nestjs.com/providers
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
