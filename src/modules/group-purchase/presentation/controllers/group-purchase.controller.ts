import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../../../shared/auth/current-user.decorator';
import { CreateGroupPurchaseUseCase } from '../../application/use-cases/create-group-purchase/create-group-purchase.use-case';
import { CreateGroupPurchaseDto } from '../../application/use-cases/create-group-purchase/create-group-purchase.dto';
import { JoinGroupPurchaseUseCase } from '../../application/use-cases/join-group-purchase/join-group-purchase.use-case';
import { LeaveGroupPurchaseUseCase } from '../../application/use-cases/leave-group-purchase/leave-group-purchase.use-case';
import { GetGroupPurchaseUseCase } from '../../application/use-cases/get-group-purchase/get-group-purchase.use-case';
import { ListGroupPurchasesUseCase } from '../../application/use-cases/list-group-purchases/list-group-purchases.use-case';
import { ListGroupPurchasesDto } from '../../application/use-cases/list-group-purchases/list-group-purchases.dto';

@Controller('group-purchases')
export class GroupPurchaseController {
  constructor(
    private readonly createGroupPurchase: CreateGroupPurchaseUseCase,
    private readonly joinGroupPurchase: JoinGroupPurchaseUseCase,
    private readonly leaveGroupPurchase: LeaveGroupPurchaseUseCase,
    private readonly getGroupPurchase: GetGroupPurchaseUseCase,
    private readonly listGroupPurchases: ListGroupPurchasesUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateGroupPurchaseDto) {
    return this.createGroupPurchase.execute(user.userId, dto);
  }

  @Get()
  list(@Query() dto: ListGroupPurchasesDto) {
    return this.listGroupPurchases.execute(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.getGroupPurchase.execute(id);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  join(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.joinGroupPurchase.execute(id, user.userId);
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveGroupPurchase.execute(id, user.userId);
  }
}
