import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicketDto } from './dto/support-ticket.dto';
import { SupportTicket } from './entities/support-ticket.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly repository: Repository<SupportTicket>,
  ) {}

  async createTicket(data: SupportTicketDto): Promise<SupportTicket> {
    const ticket = this.repository.create(data);
    return await this.repository.save(ticket);
  }
}
