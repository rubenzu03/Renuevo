import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
});

type SendMailArgs = {
  subject: string;
  text: string;
};

export async function sendMail({ subject, text }: SendMailArgs): Promise<void> {
  const to = process.env.NOTIFY_EMAIL;
  if (!to) throw new Error("NOTIFY_EMAIL is not set");

  await transport.sendMail({
    from: process.env.MAIL_FROM ?? "Renuevo <renuevo@localhost>",
    to,
    subject,
    text,
  });
}