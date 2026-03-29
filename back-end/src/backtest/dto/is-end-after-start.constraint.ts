import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEndAfterStart', async: false })
export class IsEndAfterStartConstraint implements ValidatorConstraintInterface {
  validate(endDate: unknown, args: ValidationArguments): boolean {
    const obj = args.object as { startDate?: unknown };
    if (typeof endDate !== 'number' || typeof obj.startDate !== 'number') {
      return false;
    }
    return endDate > obj.startDate;
  }

  defaultMessage(): string {
    return 'endDate must be after startDate';
  }
}
