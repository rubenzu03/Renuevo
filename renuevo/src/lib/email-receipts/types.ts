export type EmailMessage = {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: Date;
};

export type ParsedReceipt = {
  merchantName: string;
  amount: number;
  currency: string;
  date: Date;
};
