import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * Validates Supabase JWTs and enforces that the authenticated
 * user has the 'admin' role in user_profiles.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token.');
    }

    const { data, error } = await this.supabase
      .getClient()
      .auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired token.');
    }

    const { data: profile } = await this.supabase
      .getClient()
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', data.user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      throw new UnauthorizedException('Admin access required.');
    }

    (request as any).user = data.user;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
