import { createTransport } from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid-transport";

export class MailService {
  static get #transporter() {
    return createTransport(
      sendgridTransport({
        auth: { api_key: process.env.SEND_GRID_API_KEY! },
      })
    );
  }

  static readonly sendMail = async ({
    recipientEmail,
    subject,
    body,
  }: {
    recipientEmail: string;
    subject: string;
    body: string;
  }): Promise<void> => {
    await this.#transporter.sendMail({
      to: recipientEmail,
      from: "kaushik8695@gmail.com",
      subject: subject,
      text: body,
    });
  };
}
