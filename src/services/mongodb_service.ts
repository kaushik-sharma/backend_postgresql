import mongoose from "mongoose";

export default class MongoDbService {
  static readonly connect = async (): Promise<void> => {
    await mongoose.connect(process.env.MONGODB_BASE_URL!);
  };
}
