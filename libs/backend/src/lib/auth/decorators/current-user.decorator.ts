import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/auth-user.interface';

export const CurrentUser = createParamDecorator((data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user: AuthenticatedUser | undefined = request?.user;

  if (!data || !user) {
    return user;
  }

  return user[data];
});

