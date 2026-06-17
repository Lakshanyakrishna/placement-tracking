export interface IMailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface IMailer {
  send(options: IMailOptions): Promise<void>;
}
