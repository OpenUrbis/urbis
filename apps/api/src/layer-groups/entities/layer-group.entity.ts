import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('layer_groups')
export class LayerGroup {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  subGroups?: { id: string; name: string }[];
}
