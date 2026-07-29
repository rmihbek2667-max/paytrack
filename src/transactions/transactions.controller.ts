import {
  Controller, Get, Post, Delete, Body, Param,
  Query, UseGuards, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private txService: TransactionsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateTransactionDto) {
    return this.txService.create(req.user.sub, dto);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('limit')    limit?: string,
    @Query('offset')   offset?: string,
    @Query('type')     type?: 'income' | 'expense',
    @Query('category') category?: string,
    @Query('from')     from?: string,
    @Query('to')       to?: string,
  ) {
    return this.txService.findAll(req.user.sub, {
      limit:    limit    ? parseInt(limit)    : undefined,
      offset:   offset   ? parseInt(offset)   : undefined,
      type, category, from, to,
    });
  }

  @Get('summary')
  getSummary(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to')   to?: string,
  ) {
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      .toISOString().slice(0, 10);
    const defaultTo = now.toISOString().slice(0, 10);
    return this.txService.getSummary(req.user.sub, from ?? defaultFrom, to ?? defaultTo);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.txService.findOne(req.user.sub, id);
  }

  @Delete(':id')
  delete(@Req() req: any, @Param('id') id: string) {
    return this.txService.delete(req.user.sub, id);
  }
}
