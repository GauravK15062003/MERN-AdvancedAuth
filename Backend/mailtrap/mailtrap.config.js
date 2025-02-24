import { MailtrapClient } from "mailtrap";

const TOKEN = "cef7beea2fa8ba4df5dba9da613054b3"

export const mailtrapClient = new MailtrapClient({
  token: TOKEN,
});

export const sender = {
  email: "hello@demomailtrap.com",
  name: "Gaurav Kumar",
};

