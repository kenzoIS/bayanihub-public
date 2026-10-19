import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ShiftsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getPendingShifts() {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('volunteer_shifts')
      .select(`
        id,
        clock_in,
        clock_out,
        status,
        volunteer_auth_id
      `)
      .in('status', ['pending', 'flagged'])
      .not('clock_out', 'is', null)
      .order('clock_out', { ascending: false });

    if (error) throw error;
    
    // Fetch user profiles for names
    if (data && data.length > 0) {
      const authIds = data.map(d => d.volunteer_auth_id);
      const { data: profiles } = await client
        .from('user_profiles')
        .select('auth_user_id, first_name, last_name')
        .in('auth_user_id', authIds);
        
      return data.map(shift => {
        const p = profiles?.find(prof => prof.auth_user_id === shift.volunteer_auth_id);
        return {
          ...shift,
          volunteer_name: p ? `${p.first_name} ${p.last_name}` : 'Unknown Volunteer',
        };
      });
    }

    return data ?? [];
  }

  async approveShift(id: string) {
    const client = this.supabase.getClient();
    
    // 1. Get the shift
    const { data: shift, error: fetchErr } = await client
      .from('volunteer_shifts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchErr || !shift) throw new NotFoundException('Shift not found');
    if (!shift.clock_out) throw new Error('Cannot approve a shift that is not clocked out');

    // 2. Calculate hours
    const clockIn = new Date(shift.clock_in);
    const clockOut = new Date(shift.clock_out);
    const diffMs = clockOut.getTime() - clockIn.getTime();
    const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    // 3. Update shift
    const { data: updatedShift, error: updateErr } = await client
      .from('volunteer_shifts')
      .update({
        status: 'approved',
        total_hours: totalHours
      })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 4. Update total_volunteer_hours in user_profiles
    // We fetch current, add, then update
    const { data: profile } = await client
      .from('user_profiles')
      .select('total_volunteer_hours')
      .eq('auth_user_id', shift.volunteer_auth_id)
      .single();
      
    const currentHours = Number(profile?.total_volunteer_hours ?? 0);
    const newTotal = currentHours + Number(totalHours);
    
    await client
      .from('user_profiles')
      .update({ total_volunteer_hours: newTotal })
      .eq('auth_user_id', shift.volunteer_auth_id);

    return updatedShift;
  }

  async denyShift(id: string) {
    const client = this.supabase.getClient();
    const { data, error } = await client
      .from('volunteer_shifts')
      .update({ status: 'flagged' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
