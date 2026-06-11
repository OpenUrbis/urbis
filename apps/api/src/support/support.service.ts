import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'common/mail/mail.service';
import { Repository } from 'typeorm';
import { SupportTicketDto } from './dto/support-ticket.dto';
import { SupportTicket } from './entities/support-ticket.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly repository: Repository<SupportTicket>,
    private readonly mailService: MailService,
  ) {}

  async createTicket({
    email,
    message,
    name,
    type,
    files,
  }: SupportTicketDto): Promise<SupportTicket> {
    const ticket = this.repository.create({
      email,
      message,
      name,
      type,
      files,
    });
    const savedTicket = await this.repository.save(ticket);

    await this.mailService.sendSupportTicket({
      id: savedTicket.id,
      name: savedTicket.name,
      email: savedTicket.email,
      message: savedTicket.message,
      type: savedTicket.type,
      files: savedTicket.files,
    });

    return savedTicket;
  }
}
