import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string; // primary identifier

  @Column()
  passwordHash!: string;

  @Column({ default: false })
  emailVerified!: boolean;

  // Tracks whether this device has registered a biometric key with us.
  // The actual FaceID/fingerprint never touches the backend -- see mobile/services/biometrics.ts
  @Column({ default: false })
  biometricEnabled!: boolean;

  @Column({ nullable: true })
  fullName!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
