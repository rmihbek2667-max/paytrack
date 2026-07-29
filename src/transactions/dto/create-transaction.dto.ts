import {
  IsString, IsNumber, IsPositive, IsIn,
  IsDateString, IsOptional, MaxLength, MinLength,
} from 'class-validator';

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive({ message: 'Amount must be a positive number' })
  amount!: number;

  @IsString()
  @IsIn(['income', 'expense'], { message: 'Type must be income or expense' })
  type!: 'income' | 'expense';

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  category!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
  date!: string;
}
