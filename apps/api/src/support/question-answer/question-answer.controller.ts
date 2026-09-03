import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { OrganizationGuard } from 'common/guards/organization/organization.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { CreateQuestionAnswerDto } from '../dto/create-question-answer.dto';
import { UpdateQuestionAnswerDto } from '../dto/update-question-answer.dto';
import { QuestionAnswerService } from './question-answer.service';

@ApiTags('Support - Question Answers')
@Controller('support/question-answers')
export class QuestionAnswerController {
  constructor(private readonly questionAnswerService: QuestionAnswerService) {}

  @UseGuards(AccessControlGuard, OrganizationGuard)
  @ApiBearerAuth()
  @Post()
  @RequirePermission({
    permissions: {
      action: 'create',
      resource: 'question-answer',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @ApiOperation({ summary: 'Create a new question answer' })
  @ApiResponse({
    status: 201,
    description: 'The question answer has been successfully created.',
  })
  create(@Body() createQuestionAnswerDto: CreateQuestionAnswerDto) {
    return this.questionAnswerService.create(createQuestionAnswerDto);
  }

  @Get()
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'question-answer',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @ApiOperation({ summary: 'List all question answers' })
  @ApiQuery({
    name: 'app',
    required: false,
    type: String,
    description:
      'Filter questions by application (e.g., "web", "accounts", "site")',
  })
  @ApiResponse({ status: 200, description: 'Returns all question answers.' })
  findAll(@Query('app') app?: string) {
    return this.questionAnswerService.findAll(app);
  }

  @Get(':id')
  @RequirePermission({
    permissions: {
      action: 'list',
      resource: 'question-answer',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @ApiOperation({ summary: 'Get a question answer by id' })
  @ApiResponse({ status: 200, description: 'Returns the question answer.' })
  @ApiResponse({ status: 404, description: 'Question answer not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionAnswerService.findOne(id);
  }

  @UseGuards(AccessControlGuard, OrganizationGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @RequirePermission({
    permissions: {
      action: 'update',
      resource: 'question-answer',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @ApiOperation({ summary: 'Update a question answer' })
  @ApiResponse({
    status: 200,
    description: 'The question answer has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Question answer not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuestionAnswerDto: UpdateQuestionAnswerDto,
  ) {
    return this.questionAnswerService.update(id, updateQuestionAnswerDto);
  }

  @UseGuards(AccessControlGuard, OrganizationGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @RequirePermission({
    permissions: {
      action: 'delete',
      resource: 'question-answer',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @ApiOperation({ summary: 'Delete a question answer' })
  @ApiResponse({
    status: 200,
    description: 'The question answer has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Question answer not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionAnswerService.remove(id);
  }
}
