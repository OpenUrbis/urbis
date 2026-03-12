import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateQuestionTabDto } from '../dto/create-question-tab.dto';
import { UpdateQuestionTabDto } from '../dto/update-question-tab.dto';
import { QuestionTabService } from './question-tab.service';

@ApiTags('Support - Question Tabs')
@Controller('support/question-tabs')
export class QuestionTabController {
  constructor(private readonly questionTabService: QuestionTabService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new question tab' })
  @ApiResponse({
    status: 201,
    description: 'The question tab has been successfully created.',
  })
  create(@Body() createQuestionTabDto: CreateQuestionTabDto) {
    return this.questionTabService.create(createQuestionTabDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all question tabs' })
  @ApiResponse({ status: 200, description: 'Returns all question tabs.' })
  findAll() {
    return this.questionTabService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question tab by id' })
  @ApiResponse({ status: 200, description: 'Returns the question tab.' })
  @ApiResponse({ status: 404, description: 'Question tab not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionTabService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a question tab' })
  @ApiResponse({
    status: 200,
    description: 'The question tab has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Question tab not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuestionTabDto: UpdateQuestionTabDto,
  ) {
    return this.questionTabService.update(id, updateQuestionTabDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question tab' })
  @ApiResponse({
    status: 200,
    description: 'The question tab has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Question tab not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.questionTabService.remove(id);
  }
}
