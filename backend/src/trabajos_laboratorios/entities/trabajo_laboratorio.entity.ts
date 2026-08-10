import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Laboratorio } from '../../laboratorios/entities/laboratorio.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { PrecioLaboratorio } from '../../precios_laboratorios/entities/precio-laboratorio.entity';
import { Cubeta } from '../../cubetas/entities/cubeta.entity';

@Entity('trabajos_laboratorios')
export class TrabajoLaboratorio {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'access_id', nullable: true })
    access_id: string;

    @Column({ nullable: true })
    idLaboratorio: number;

    @ManyToOne(() => Laboratorio, { nullable: true })
    @JoinColumn({ name: 'idLaboratorio' })
    laboratorio: Laboratorio;

    @Column({ nullable: true })
    idPaciente: number;

    @ManyToOne(() => Paciente, { nullable: true })
    @JoinColumn({ name: 'idPaciente' })
    paciente: Paciente;

    @Column({ nullable: true })
    idprecios_laboratorios: number;

    @ManyToOne(() => PrecioLaboratorio, { nullable: true })
    @JoinColumn({ name: 'idprecios_laboratorios' })
    precioLaboratorio: PrecioLaboratorio;

    @Column({ type: 'date', nullable: true })
    fecha: string;

    @Column({ nullable: true })
    pieza: string;

    @Column({ default: 1 })
    cantidad: number;

    @Column({ type: 'date', nullable: true })
    fecha_pedido: string;

    @Column({ nullable: true })
    color: string;

    @Column({ default: 'no terminado' })
    estado: string;

    @Column({ type: 'date', nullable: true })
    fecha_terminado: string;

    @Column({ default: 'no' })
    cita: string;

    @Column({ type: 'text', nullable: true })
    observacion: string;

    @Column({ default: 'no' })
    pagado: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    precio_unitario: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    total: number;

    @Column({ default: 'no' })
    resaltar: string;

    @Column({ nullable: true })
    idCubeta: number;

    @ManyToOne(() => Cubeta, { nullable: true })
    @JoinColumn({ name: 'idCubeta' })
    cubeta: Cubeta;
}
