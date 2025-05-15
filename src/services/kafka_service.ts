// import { Kafka, logLevel } from "kafkajs";
// import { Transaction } from "sequelize";

// import {
//   ReactionAttributes,
//   ReactionModel,
// } from "../models/post/reaction_model.js";
// import PostgresService from "./postgres_service.js";
// import logger from "../utils/logger.js";

// export class KafkaService {
//   static readonly #postKafka = new Kafka({
//     clientId: "post-consumer",
//     brokers: ["localhost:9092"],
//     logLevel: logLevel.INFO,
//   });

//   static readonly producer = this.#postKafka.producer();

//   static readonly #postConsumer = this.#postKafka.consumer({
//     groupId: "post-service-group",
//   });

//   static readonly setupProducers = async () => {
//     await this.producer.connect();
//     logger.info("Producers setup successfully.");
//   };

//   static readonly setupConsumers = async () => {
//     await this.#postConsumer.connect();
//     await this.#postConsumer.subscribe({
//       topic: "post-reactions",
//       fromBeginning: false,
//     });

//     this.#postConsumer.run({
//       autoCommit: false,
//       eachMessage: async ({ topic, partition, message }) => {
//         if (!message.value) return;

//         const event = JSON.parse(
//           message.value.toString()
//         ) as ReactionAttributes;

//         await PostgresService.sequelize.transaction(async (tx) => {
//           await this.#createReaction(event, tx);
//         });

//         await this.#postConsumer.commitOffsets([
//           { topic, partition, offset: (Number(message.offset) + 1).toString() },
//         ]);
//       },
//     });

//     logger.info("Consumers setup successfully.");
//   };

//   static readonly #createReaction = async (
//     reactionData: ReactionAttributes,
//     tx: Transaction
//   ): Promise<void> => {
//     // Check if the user already has a reaction for that post
//     const prevReaction = await ReactionModel.findOne({
//       where: {
//         postId: reactionData.postId,
//         userId: reactionData.userId,
//       },
//       attributes: ["emotionType"],
//       transaction: tx,
//     });

//     // If same reaction as before then delete it
//     if (reactionData.emotionType === prevReaction?.toJSON().emotionType) {
//       await ReactionModel.destroy({
//         where: {
//           postId: reactionData.postId,
//           userId: reactionData.userId,
//         },
//         transaction: tx,
//       });
//       return;
//     }

//     // Save new or update the existing reaction
//     await ReactionModel.upsert(reactionData, { transaction: tx });
//   };
// }
