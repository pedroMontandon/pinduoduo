import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../../../shared/auth/current-user.decorator';
import { ListNotificationsUseCase } from '../../application/use-cases/list-notifications/list-notifications.use-case';
import { ListNotificationsDto } from '../../application/use-cases/list-notifications/list-notifications.dto';
import { GetUnreadCountUseCase } from '../../application/use-cases/get-unread-count/get-unread-count.use-case';
import { MarkNotificationReadUseCase } from '../../application/use-cases/mark-notification-read/mark-notification-read.use-case';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly listNotifications: ListNotificationsUseCase,
    private readonly getUnreadCount: GetUnreadCountUseCase,
    private readonly markNotificationRead: MarkNotificationReadUseCase,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() dto: ListNotificationsDto) {
    return this.listNotifications.execute(user.userId, dto);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.getUnreadCount.execute(user.userId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.markNotificationRead.markAll(user.userId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.markNotificationRead.execute(user.userId, id);
  }
}
