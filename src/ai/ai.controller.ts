import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('chat')
  chat(
    @Req() req: any,
    @Body() body: { messages: { role: string; content: string }[] },
  ) {
    return this.aiService.chat(req.user.sub, body.messages);
  }
}
