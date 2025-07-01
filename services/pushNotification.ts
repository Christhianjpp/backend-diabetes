import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

interface SendNotificationParams {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

export class PushNotificationService {
  private expo: Expo;

  constructor() {
    this.expo = new Expo({ useFcmV1: true });
  }

  async sendNotification({ tokens, title, body, data = {} }: SendNotificationParams): Promise<{ done: boolean; tickets: ExpoPushTicket[][] }> {
    const areExpoTokens = tokens.every(Expo.isExpoPushToken);
    if (!areExpoTokens) {
      throw new Error('Invalid Expo push token');
    }

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[][] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(ticketChunk);
      } catch (error) {
        console.error('Error sending notifications:', error);
        throw new Error('Error sending notifications');
      }
    }

    return { done: true, tickets };
  }
}
