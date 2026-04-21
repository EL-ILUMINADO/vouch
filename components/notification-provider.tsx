"use client";

import * as React from "react";

export type NotificationType =
  | "match"
  | "like_received"
  | "radar_request"
  | "radar_accepted"
  | "admin";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  actorName: string | null;
  actorImage: string | null;
}

interface NotificationContextValue {
  notifications: NotificationRow[];
  unreadCount: number;
}

const NotificationContext = React.createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
});

export function useNotifications() {
  return React.useContext(NotificationContext);
}

export function NotificationProvider({
  initialUnreadCount = 0,
  children,
}: {
  initialUnreadCount?: number;
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = React.useState<NotificationRow[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);

  React.useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/notifications/stream");

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as Partial<NotificationContextValue>;
          if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
          if (data.notifications) setNotifications(data.notifications);
        } catch {
          // Malformed event — ignore.
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 6 s.
        retryTimeout = setTimeout(connect, 6000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
