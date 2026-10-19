import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TasksService {
  constructor(private supabase: SupabaseService) {}

  private get db() {
    return this.supabase.getClient();
  }

  /** Fetch all tasks stored in volunteer_roles.tasks JSONB for a given role */
  async getRoleTasks(roleId: string) {
    const { data, error } = await this.db
      .from('volunteer_roles')
      .select('id, title, tasks')
      .eq('id', roleId)
      .single();

    if (error || !data) throw new NotFoundException(`Role ${roleId} not found`);

    const tasks: { title: string; description?: string }[] = data.tasks ?? [];
    return { role_id: roleId, role_title: data.title, tasks };
  }

  /** Append a new task object to volunteer_roles.tasks JSONB array */
  async addRoleTask(roleId: string, title: string, description?: string) {
    if (!title?.trim()) throw new BadRequestException('Task title is required');

    // Fetch existing tasks first
    const { data, error } = await this.db
      .from('volunteer_roles')
      .select('tasks')
      .eq('id', roleId)
      .single();

    if (error || !data) throw new NotFoundException(`Role ${roleId} not found`);

    const existingTasks: { title: string; description?: string }[] = data.tasks ?? [];

    // Prevent duplicate task titles (case-insensitive)
    if (existingTasks.some((t) => t.title.toLowerCase() === title.trim().toLowerCase())) {
      throw new BadRequestException(`Task "${title}" already exists for this role`);
    }

    const newTask = { title: title.trim(), description: description?.trim() ?? '' };
    const updatedTasks = [...existingTasks, newTask];

    const { error: updateError } = await this.db
      .from('volunteer_roles')
      .update({ tasks: updatedTasks })
      .eq('id', roleId);

    if (updateError) throw new BadRequestException(updateError.message);

    return { success: true, task: newTask, tasks: updatedTasks };
  }

  /** Insert task assignment records into volunteer_task_assignments */
  async assignTasks(
    applicationId: string,
    roleId: string,
    taskTitles: string[],
    assignedBy?: string,
    campaignId?: string,
  ) {
    if (!taskTitles?.length) throw new BadRequestException('No tasks selected');
    if (!applicationId) throw new BadRequestException('Application ID is required');
    if (!roleId) throw new BadRequestException('Role ID is required');

    const { data: application, error: applicationError } = await this.db
      .from('volunteer_applications')
      .select('id, role_id, status')
      .eq('id', applicationId)
      .maybeSingle();

    if (applicationError) throw new BadRequestException(applicationError.message);
    if (!application) throw new NotFoundException(`Application ${applicationId} not found`);
    if (application.role_id !== roleId) {
      throw new BadRequestException('Selected volunteer does not belong to the selected role.');
    }

    const { data: role, error: roleError } = await this.db
      .from('volunteer_roles')
      .select('id, campaign_id, title')
      .eq('id', roleId)
      .maybeSingle();

    if (roleError) throw new BadRequestException(roleError.message);
    if (!role) throw new NotFoundException(`Role ${roleId} not found`);

    const requestedCampaignId = campaignId?.trim();
    if (requestedCampaignId && role.campaign_id && requestedCampaignId !== role.campaign_id) {
      throw new BadRequestException('Selected mission does not match the volunteer role.');
    }

    const resolvedCampaignId = requestedCampaignId || role.campaign_id;
    if (!resolvedCampaignId) {
      throw new BadRequestException('Mission ID is required before assigning volunteer tasks.');
    }

    // 1. Check if a deployment already exists for this application in this mission
    let deploymentId: string | null = null;
    const { data: existingDeployments, error: deploymentLookupError } = await this.db
      .from('volunteer_deployments')
      .select('id, status, damayan_operation_id')
      .eq('application_id', applicationId)
      .eq('damayan_operation_id', resolvedCampaignId)
      .in('status', ['active', 'assigned'])
      .order('date_assigned', { ascending: false })
      .limit(1);

    if (deploymentLookupError) throw new BadRequestException(deploymentLookupError.message);

    if (existingDeployments && existingDeployments.length > 0) {
      deploymentId = existingDeployments[0].id;
    } else {
      // 2. Create a new deployment if one doesn't exist
      const { data: newDeployment, error: deployErr } = await this.db
        .from('volunteer_deployments')
        .insert({
          application_id: applicationId,
          damayan_operation_id: resolvedCampaignId,
          task_description: taskTitles.join(', '),
          status: 'active',
          date_assigned: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (deployErr || !newDeployment) {
        throw new BadRequestException('Failed to create volunteer deployment for the selected mission: ' + (deployErr?.message || 'Unknown error'));
      }
      deploymentId = newDeployment.id;
    }

    // 3. Insert task assignments using the deploymentId.
    // This table may not have a unique constraint, so avoid ON CONFLICT and
    // explicitly skip tasks already assigned to the same deployment.
    const { data: existingAssignments, error: assignmentLookupError } = await this.db
      .from('volunteer_task_assignments')
      .select('task_title')
      .eq('deployment_id', deploymentId)
      .in('task_title', taskTitles);

    if (assignmentLookupError) throw new BadRequestException(assignmentLookupError.message);

    const existingTaskTitles = new Set((existingAssignments ?? []).map((task) => task.task_title));
    const newTaskTitles = taskTitles.filter((title) => !existingTaskTitles.has(title));

    if (newTaskTitles.length === 0) {
      return {
        success: true,
        assigned: 0,
        message: 'Selected task(s) were already assigned to this volunteer.',
      };
    }

    const records = newTaskTitles.map((title) => ({
      deployment_id: deploymentId,
      role_id: roleId,
      task_title: title,
      status: 'pending',
      assigned_by: assignedBy ?? null,
      assigned_at: new Date().toISOString(),
    }));

    const { data, error } = await this.db
      .from('volunteer_task_assignments')
      .insert(records)
      .select();

    if (error) throw new BadRequestException(error.message);

    return {
      success: true,
      assigned: data?.length ?? newTaskTitles.length,
      message: `${data?.length ?? newTaskTitles.length} task(s) assigned successfully.`,
    };
  }
}
