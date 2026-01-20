import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SupportTicketDto } from './dto/support-ticket.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Post('create-ticket')
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({
    status: 201,
    description: 'The support ticket has been successfully created.',
    schema: {
      example: {
        id: '0001-AA',
        name: 'John Doe',
        email: 'john.doe@example.com',
        message: 'Issue description...',
        files: [],
        type: 'bug-report',
      },
    },
  })
  createTicket(@Body() supportTicketDto: SupportTicketDto) {
    return this.service.createTicket(supportTicketDto);
  }
}
