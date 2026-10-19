import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  /** GET /api/tasks/role/:roleId — fetch task list for a role */
  @Get('role/:roleId')
  getRoleTasks(@Param('roleId') roleId: string) {
    return this.service.getRoleTasks(roleId);
  }

  /** POST /api/tasks/role/:roleId — add a new task to a role's task list */
  @Post('role/:roleId')
  addRoleTask(
    @Param('roleId') roleId: string,
    @Body() body: { title: string; description?: string },
  ) {
    return this.service.addRoleTask(roleId, body.title, body.description);
  }

  /** POST /api/tasks/assign — assign tasks to a volunteer's deployment */
  @Post('assign')
  assignTasks(
    @Body() body: {
      application_id: string;
      role_id: string;
      campaign_id?: string;
      task_titles: string[];
      assigned_by?: string;
    },
  ) {
    return this.service.assignTasks(
      body.application_id,
      body.role_id,
      body.task_titles,
      body.assigned_by,
      body.campaign_id,
    );
  }
}
