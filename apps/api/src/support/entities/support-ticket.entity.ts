import { Column, Entity, PrimaryColumn } from 'typeorm';
import { SupportTicketType } from '../enums/support-ticket.enum';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryColumn({
    type: 'varchar',
    default: () => 'generate_support_ticket_id()',
  })
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  message: string;

  @Column('text', { array: true, nullable: true })
  files: string[];

  @Column()
  type: SupportTicketType;
}
