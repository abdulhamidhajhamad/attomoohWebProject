import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from '../schemas/counter.schema.js';

@Injectable()
export class CounterRepository {
  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  /**
   * Atomically increment a named counter and return the new value.
   * Creates the counter document if it doesn't exist yet.
   */
  async getNextValue(sequenceName: string): Promise<number> {
    const doc = await this.counterModel.findOneAndUpdate(
      { name: sequenceName },
      { $inc: { value: 1 } },
      { returnDocument: 'after', upsert: true },
    );
    return doc!.value;
  }
}
