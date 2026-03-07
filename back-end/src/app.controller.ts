/**
 * Root APP CONTROLLER – health and welcome (no auth).
 *
 * What it does: GET / (welcome), GET /health (status ok). Tagged "health" in Swagger.
 * Routes are under api/v1 (global prefix in main.ts).
 *
 * @see https://docs.nestjs.com/controllers
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health(): { status: string } {
    return this.appService.getHealth();
  }
}
