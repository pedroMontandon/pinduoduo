import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateUserUseCase } from '../../application/use-cases/create-user/create-user.use-case';
import { CreateUserDto } from '../../application/use-cases/create-user/create-user.dto';
import { LoginUseCase } from '../../application/use-cases/login/login.use-case';
import { LoginDto } from '../../application/use-cases/login/login.dto';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: LoginDto) {
    return this.login.execute(dto);
  }
}
