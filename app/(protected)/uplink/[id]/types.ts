export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
  replyToId?: string | null;
  replyToContent?: string | null;
  replyToSenderId?: string | null;
  editedAt?: Date | string | null;
  deletedAt?: Date | string | null;
  deletedForSender?: boolean;
  deletedForReceiver?: boolean;
}
