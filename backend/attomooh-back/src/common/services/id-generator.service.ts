import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Counter,
  CounterDocument,
} from '../../service-orders/schemas/counter.schema.js';
import { IdPrefix } from '../enums/id-prefix.enum.js';

/**
 * Factory service for generating prefixed auto-increment IDs.
 * Uses atomic findOneAndUpdate with upsert to guarantee uniqueness.
 *
 * Examples: M0000001, C0000001, R0000001
 */
@Injectable()
export class IdGeneratorService {
  private static readonly SEQUENCE_MAP: Record<IdPrefix, string> = {
    [IdPrefix.MACHINE]: 'machine',
    [IdPrefix.CUSTOMER]: 'customer',
    [IdPrefix.SUPPLIER]: 'supplier',
    [IdPrefix.EMPLOYEE]: 'employee',
    [IdPrefix.INVENTORY]: 'inventory',
    [IdPrefix.TOOL]: 'tool',
    [IdPrefix.AREA]: 'area',
    [IdPrefix.VEHICLE]: 'vehicle',
    [IdPrefix.RECEPTION]: 'reception',
    [IdPrefix.PRODUCTION]: 'production',
    [IdPrefix.PURCHASE_ORDER]: 'purchaseOrder',
  };

  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  /**
   * Generate the next prefixed ID for a given entity type.
   * @param prefix - The IdPrefix enum value
   * @returns e.g. "M0000001"
   */
  async generateId(prefix: IdPrefix): Promise<string> {
    const sequenceName = IdGeneratorService.SEQUENCE_MAP[prefix];
    const doc = await this.counterModel.findOneAndUpdate(
      { name: sequenceName },
      {
        $inc: { value: 1 },
        $setOnInsert: { prefix, padLength: 7 },
      },
      { new: true, upsert: true },
    );
    const padded = String(doc!.value).padStart(doc!.padLength || 7, '0');
    return `${prefix}${padded}`;
  }

  /**
   * Validate a manually-entered custom ID format.
   * @param id - The custom ID string (e.g. "M0000005")
   * @param prefix - Expected prefix
   * @returns true if valid format
   */
  isValidCustomId(id: string, prefix: IdPrefix): boolean {
    const regex = new RegExp(`^${prefix}\\d{7}$`);
    return regex.test(id);
  }
}
