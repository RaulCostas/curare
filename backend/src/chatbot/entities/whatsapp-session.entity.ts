import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('whatsapp_sessions')
export class WhatsappSession {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar' })
    @Index()
    type: string; // 'creds' or 'keys'

    @Column({ type: 'text', nullable: true })
    @Index()
    keyId: string; // Used for pre-keys, sessions, etc.

    @Column({ type: 'json' })
    data: any;
}
